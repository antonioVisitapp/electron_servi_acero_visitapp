const request = require('request');
const fs = require('fs');
const exec = require('child_process').exec;
const serial = require('../controller/serial_reader_controller');
const Printer = require('../controller/printer');

const socket = require('socket.io-client')('http://industrial.visitapp.com.mx:5004');

const channel = "serviacero-4";
const token = "1e3a8be01c4cjsd98dss87ds4kjds0c9b256fcfce1e3a8b55d01c4c74e21c96efa5d01c375c96efed01266e0dbef53d0";
const path = "/home/visitapp/VisitApp/VisitappIndustry/visitapp-insudstrial-localserver";

function qrArrive(folio) {
    const sendData = { channel, folio, token };
    const formData = new URLSearchParams(sendData).toString();
    const headers = { 'Content-Length': formData.length, 'Content-Type': 'application/x-www-form-urlencoded' };
    request({ headers, uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/carrier/qr', body: formData, method: 'POST' });
}

function visitorArrive(folio) {
    const sendData = { channel, folio };
    const formData = new URLSearchParams(sendData).toString();
    const headers = { 'Content-Length': formData.length, 'Content-Type': 'application/x-www-form-urlencoded' };
    console.log(folio);
    request({ headers, uri: 'http://industrial.visitapp.com.mx:5004/api/v1/visits/visitor/qr', body: formData, method: 'POST' }, (error, response, body) => {
        console.log(error);
        console.log(body);
    });
}

// Fotos
function takePhoto(id, url, reference, kind, camera_id) {
    const filename = `/${reference}.jpg`;
    exec(`wget ${url} -O ${path + filename}`, function (error, stdout, stderr) {
        const formData = {
            'visit[token]': token,
            'visit[reference]': reference,
            'visit[camera_id]': camera_id,
            'visit[file]': fs.createReadStream(path + filename)
        };
        request.post({
            url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`,
            headers: { 'Content-Type': 'multipart/form-data' },
            formData
        }, function (err) {
            if (err) console.error('upload failed:', err);
        });
    });
}

function uploadTagPhoto(id, url, reference, kind, camera_id) {
    const formData = {
        'visit[token]': token,
        'visit[reference]': reference,
        'visit[camera_id]': camera_id,
        'visit[file]': fs.createReadStream(`${path}/${reference}_old.jpg`)
    };
    request.post({
        url: `http://industrial.visitapp.com.mx:3001/api/v1/visits-access/upload/${id}`,
        headers: { 'Content-Type': 'multipart/form-data' },
        formData
    }, function (err) {
        if (err) console.error('upload failed:', err);
    });
}

// Eventos socket
socket.on(`print-ticket-${channel}`, (data) => {
    console.log('Socket print-ticket')
    console.log(channel)
    new Printer(data);


})

socket.on(`take-photo-${channel}`, (data) => {
    data.cameras.forEach(cam => takePhoto(data.id, cam.url, cam.reference, cam.kind, cam.id));
});

socket.on(`take-tag-photo-walking-${channel}`, (data) => {
    const id = data.id;
    request('http://industrial.visitapp.com.mx:3001/api/v1/cameras-by-kind?branch=2&kind=walking', null, (err, res, body) => {
        try {
            JSON.parse(body).forEach(cam => uploadTagPhoto(id, cam.url, cam.reference, cam.kind, cam.id));
        } catch (error) { console.log(error); }
    });
});

socket.on(`take-tag-photo-car-${channel}`, (data) => {
    const id = data.id;
    request('http://industrial.visitapp.com.mx:3001/api/v1/cameras-by-kind?branch=2&kind=car', null, (err, res, body) => {
        try {
            JSON.parse(body).forEach(cam => uploadTagPhoto(id, cam.url, cam.reference, cam.kind, cam.id));
        } catch (error) { console.log(error); }
    });
});

// Serial reader
serial.on('data', (folio) => {
    if (folio.includes("visitor-")) visitorArrive(folio.split('visitor-')[1]);
    else if (folio.includes("carrier-")) qrArrive(folio.split('carrier-')[1]);
    else qrArrive(folio.length === 12 ? '0' + folio.substring(0, 11) : folio.substring(0, 12));
});

// Exportar función para inicializar sockets
module.exports = function initSockets() {
    const socket = require('socket.io-client')('http://industrial.visitapp.com.mx:5004');

    // eventos socket aquí...
    socket.on(`print-ticket-${channel}`, (data) => new Printer(data));
    // ...otros eventos

    return socket; // devuelve el objeto socket
};

