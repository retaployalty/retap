import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
const PassGenerator = require('passkit-generator');

@Controller('apple-wallet')
export class AppleWalletController {
  @Post('generate')
  async generatePass(
    @Body() body: { cardId: string; customerName: string; cardUid: string },
    @Res() res: Response,
  ) {
    const certPath = path.join(__dirname, '../../certs/retap-pass-certificato.p12');
    const certPassword = 'Rava06103!'; // Cambia con la password scelta
    const wwdrPath = path.join(__dirname, '../../certs/AppleWWDRCAG3.cer');

    const pass = PassGenerator.createPass({
      model: path.join(__dirname, '../../pass-model'),
      certificates: {
        wwdr: fs.readFileSync(wwdrPath),
        signerCert: fs.readFileSync(certPath),
        signerKey: fs.readFileSync(certPath),
        signerKeyPassphrase: certPassword,
      },
      overrides: {
        serialNumber: body.cardId,
        description: 'ReTap Loyalty Card',
        organizationName: 'ReTap',
        foregroundColor: 'rgb(255, 101, 101)',
        backgroundColor: 'rgb(255, 255, 255)',
        generic: {
          primaryFields: [
            { key: 'balance', label: 'PUNTI', value: '0' },
          ],
          secondaryFields: [
            { key: 'name', label: 'NOME', value: body.customerName },
          ],
          auxiliaryFields: [
            { key: 'card_id', label: 'ID CARTA', value: body.cardId },
          ],
        },
        barcode: {
          format: 'PKBarcodeFormatQR',
          message: JSON.stringify({
            type: 'retap_card',
            id: body.cardId,
            uid: body.cardUid,
          }),
          messageEncoding: 'iso-8859-1',
        },
      },
    });

    const stream = await pass.generate();
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename=retap-card.pkpass`,
    });
    stream.pipe(res);
  }
} 