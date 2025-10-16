import * as dgram from 'dgram';
import * as radius from 'radius';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

const RADIUS_SECRET = config.radius.secret;
const RADIUS_PORT = config.radius.port;

export class RadiusServer {
  private server: dgram.Socket;

  constructor() {
    this.server = dgram.createSocket('udp4');
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.on('message', async (msg, rinfo) => {
      try {
        const packet = radius.decode({ packet: msg, secret: RADIUS_SECRET });
        
        if (packet.code === 'Access-Request') {
          await this.handleAccessRequest(packet, rinfo);
        }
      } catch (error) {
        logger.error({ error, rinfo }, 'RADIUS packet decode error');
      }
    });

    this.server.on('listening', () => {
      const address = this.server.address();
      logger.info({ address }, 'RADIUS server listening');
    });

    this.server.on('error', (error) => {
      logger.error({ error }, 'RADIUS server error');
    });
  }

  private async handleAccessRequest(packet: any, rinfo: dgram.RemoteInfo) {
    const username = packet.attributes['User-Name'];
    const password = packet.attributes['User-Password'];

    logger.info({ username, rinfo }, 'RADIUS authentication request');

    try {
      // Check if voucher exists and is valid
      const voucher = await prisma.voucher.findFirst({
        where: {
          code: username,
          status: 'UNUSED',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          package: true
        }
      });

      let responseCode: string;
      let attributes: any = {};

      if (voucher) {
        // Mark voucher as used
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { 
            status: 'USED',
            redeemedAt: new Date()
          }
        });

        responseCode = 'Access-Accept';
        
        // Set session timeout based on package duration
        if (voucher.package.durationMinutes) {
          attributes['Session-Timeout'] = voucher.package.durationMinutes * 60;
        }

        // Set data limit if specified
        if (voucher.package.dataMb) {
          attributes['Mikrotik-Total-Limit'] = voucher.package.dataMb * 1024 * 1024;
        }

        logger.info({ voucherId: voucher.id, username }, 'RADIUS access granted');
      } else {
        responseCode = 'Access-Reject';
        logger.info({ username }, 'RADIUS access denied - invalid voucher');
      }

      const response = radius.encode_response({
        packet,
        code: responseCode,
        secret: RADIUS_SECRET,
        attributes
      });

      this.server.send(response, rinfo.port, rinfo.address);

    } catch (error) {
      logger.error({ error, username }, 'RADIUS authentication error');
      
      const response = radius.encode_response({
        packet,
        code: 'Access-Reject',
        secret: RADIUS_SECRET
      });

      this.server.send(response, rinfo.port, rinfo.address);
    }
  }

  public start() {
    this.server.bind(RADIUS_PORT);
  }

  public stop() {
    this.server.close();
  }
}