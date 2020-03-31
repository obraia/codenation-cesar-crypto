const express = require('express');
const axios = require('axios');
const sha1 = require('sha1');

const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const decryptor = require('./utils/decryptor');
const saveFile = require('./utils/saveFile');

const app = express();

app.get('/send', async (req, res) => {
    const urlGet = "https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=f97771ffefe83866d204992f9da4d9d74319dee8";
    const urlPost = "https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=f97771ffefe83866d204992f9da4d9d74319dee8";

    const response = await axios.get(urlGet);

    const shift = response.data.numero_casas;
    const encryptedString = response.data.cifrado;
    const decryptedString = decryptor(encryptedString, shift);

    response.data.decifrado = decryptedString;
    response.data.resumo_criptografico = sha1(decryptedString);
    
    const filePath = path.join(__dirname, 'tmp/');

    await saveFile(response.data, filePath, 'answer.json');
  
    const fileStream = await fs.createReadStream(filePath + '/answer.json');

    const formData = new FormData();
    formData.append('answer', fileStream,'file');

    const formHeaders = formData.getHeaders();

    const config = {
        headers: {
            ...formHeaders,
        },
    };

    await axios.post(urlPost, formData, config)
    .then(res => {
        console.log(res.data)
    })
    .catch(err => console.log(err));

    return res.json(response.data);
});

app.listen(3334, () => { console.log('Server started') });