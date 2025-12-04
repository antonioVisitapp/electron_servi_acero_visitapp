const axios = require('axios');
const fs = require('fs');
const { URLSearchParams } = require('url');
const { exec } = require('child_process');

class VisitService {
    constructor(channel, token, path) {
        this.channel = channel;
        this.token = token;
        this.basePath = path || "/home/visitapp/VisitApp/VisitappIndustry/visitapp-insudstrial-localserver";
    }

    // =======================================================================
    //   QR CARRIER
    // =======================================================================
    async qrArrive(folio) {
        try {
            console.log('[qrArrive] folio:', folio);

            const sendData = {
                channel: this.channel,
                folio,
                token: this.token
            };
            console.log('sendData object')
            console.log(sendData)
            const formData = new URLSearchParams(sendData);
            console.log(' formData.toString()', formData.toString())
            const url = 'http://industrial.visitapp.com.mx:5004/api/v1/visits/carrier/qr'
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            const body = formData.toString()

            console.log('url: ', url)
            console.log('body: ', body)
            console.log('headers: ', headers)
            const { data } = await axios.post(
                url,
                body,
                {
                    headers,
                }
            );

            console.log('[qrArrive] respuesta:', data);

        } catch (err) {
            console.error('[qrArrive] ERROR:', err.message);
        }
    }



    // =======================================================================
    //   QR VISITOR
    // =======================================================================
    async visitorArrive(folio) {
        try {
            console.log('[visitorArrive] folio:', folio);

            const sendData = {
                channel: this.channel,
                folio
            };
            const url = 'http://industrial.visitapp.com.mx:5004/api/v1/visits/visitor/qr';
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            const formData = new URLSearchParams(sendData);

            const { data } = await axios.post(
                url,
                formData.toString(),
                {
                    headers,
                }
            );

            console.log('[visitorArrive] respuesta:', data);

        } catch (err) {
            console.error('[visitorArrive] ERROR:', err.message);
        }
    }

    // =======================================================================
    //   LÓGICA CENTRAL PARA TODOS LOS FOLIOS
    // =======================================================================
    async handleFolio(raw) {
        console.log('[handleFolio] recibido:', raw);

        let folio = raw.trim();

        // -------------------------
        // códigos especiales
        // -------------------------
        if (folio.startsWith("visitor-")) {
            return this.visitorArrive(folio.replace("visitor-", ""));
        }

        if (folio.startsWith("carrier-")) {
            return this.qrArrive(folio.replace("carrier-", ""));
        }

        // -------------------------
        // códigos simples (12 dígitos)
        // -------------------------
        if (folio.length >= 12) {
            folio = folio.substring(0, 12);  // nunca pierde dígitos
        }

        // si exactamente 12 → agregar 0 al inicio (regla anterior)
        if (folio.length === 12) {
            folio = "0" + folio.substring(0, 11);
        }

        return this.qrArrive(folio);
    }

    // =======================================================================
    //   FOTOS
    // =======================================================================
    async takePhotos(data) {
        console.log('[takePhotos] ejecutado');
        const filename = `/${reference}.jpg`;
        console.log('filename', filename)
        exec(`wget ${url} -O ${filename}`, () => {
            const formData = {
                'visit[token]': this.token,
                'visit[reference]': reference,
                'visit[camera_id]': camera_id,
                'visit[file]': fs.createReadStream(filename)
            };

            request.post({
                url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`,
                headers: { 'Content-Type': 'multipart/form-data' },
                formData
            }, (err) => {
                if (err) console.error('upload failed:', err);
            });
        });
    }

    // =======================================================================
    //   FOTO DE TAG
    // =======================================================================
    async uploadTagPhotos(data, kind) {
        console.log('[uploadTagPhotos] ejecutado');

        // Aquí puedes migrar cuando uses axios
    }
}

module.exports = VisitService;
