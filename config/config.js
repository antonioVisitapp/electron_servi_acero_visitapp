export const config = {
    SERVER_PORT: '',
    PRINTER_NAME:'EPSON TM-T20II Receipt5',
    VISITAPP: {
        URL_SERVER_INDUSTRY: 'https://api-industrial.visitapp.io/api/v1/',
        URL_SOCKETS_INDUSTRY: 'https://ws-industrial.visitapp.io/',
        ENDPOINTS: {
            UPLOAD_PHOTO: (id) => `visits-access/upload/${id}`,
            // UPLOAD_PHOTO: (id) => `visits-access/upload/${id}`,
        }
    },
    

}