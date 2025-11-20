const request = require('request');
const fs = require('fs');
const exec = require('child_process').exec;

const path = "/home/visitapp/VisitApp/VisitappIndustry/visitapp-insudstrial-localserver";

function qrArrive(folio, channel, token) {
    const sendData = { channel, folio, token };
    const formData = new URLSearchParams(sendData).toString();
    const headers = { 'Content-Length': formData.length, 'Content-Type': 'application/x-www-form-urlencoded' };
    request({ headers, uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/carrier/qr', body: formData, method: 'POST' });
}

function visitorArrive(folio, channel) {
    const sendData = { channel, folio };
    const formData = new URLSearchParams(sendData).toString();
    const headers = { 'Content-Length': formData.length, 'Content-Type': 'application/x-www-form-urlencoded' };
    request({ headers, uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/visitor/qr', body: formData, method: 'POST' }, (err, res, body) => {
        if (err) console.error(err);
        else console.log(body);
    });
}

function handleFolio(folio, channel, token) {
    if (folio.includes("visitor-")) {
        const folioSplit = folio.split('visitor-')[1];
        visitorArrive(folioSplit, channel);
    } else if (folio.includes("carrier-")) {
        const folioSplit = folio.split('carrier-')[1];
        qrArrive(folioSplit, channel, token);
    } else {
        const val = folio.length == 12 ? '0' + folio.substring(0, 11) : folio.substring(0, 12);
        qrArrive(val, channel, token);
    }
}

// Función para tomar foto
function takePhotos(data, token) {
    const id = data.id;
    data.cameras.forEach(camera => {
        const filename = `/${camera.reference}.jpg`;
        exec('wget ' + camera.url + ' -O ' + path + filename, (err) => {
            if (err) console.error(err);
            const formData = {
                'visit[token]': token,
                'visit[reference]': camera.reference,
                'visit[camera_id]': camera.id,
                'visit[file]': fs.createReadStream(path + filename)
            };
            request.post({ url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`, headers: { 'Content-Type': 'multipart/form-data' }, formData });
        });
    });
}

// Función para subir foto de tag
function uploadTagPhotos(data, kind, token) {
    const id = data.id;
    const url = `http://industrial.visitapp.com.mx:3001/api/v1/cameras-by-kind?branch=2&kind=${kind}`;
    request(url, null, (err, res, body) => {
        if (err) return console.error(err);
        try {
            const cameras = JSON.parse(body);
            cameras.forEach(camera => {
                const formData = {
                    'visit[token]': token,
                    'visit[reference]': camera.reference,
                    'visit[camera_id]': camera.id,
                    'visit[file]': fs.createReadStream(path + "/" + camera.reference + "_old.jpg")
                };
                request.post({ url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`, headers: { 'Content-Type': 'multipart/form-data' }, formData });
            });
        } catch (error) {
            console.log(error);
        }
    });
}

module.exports = { handleFolio, takePhotos, uploadTagPhotos };
