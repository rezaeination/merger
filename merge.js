const express = require('express');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const cors = require('cors');
const axios = require("axios");

const app = express();
const port = 3000;
app.use(cors());
const home = "https://bible-explorer.bubbleapps.io/version-test/"; 
    const uploadEndpoint = `${home}fileupload`; 

app.post('/merge', async (req, res) => {
  try {
    // Extract image URL and overlay base64 from query parameters
    const imageUrl = req.query.imageUrl;
    const overlayB64 = req.query.overlayB64;

    if (!imageUrl || !overlayB64) {
      return res.status(400).send('Image URL and overlay base64 are required parameters');
    }

    async function overlayImages(url, b64) {
      try {
        const response = await fetch(url);
        const imageData = await response.buffer();
        const baseImage = await Jimp.read(imageData);
  
        const overlayImage = await Jimp.read(Buffer.from(b64, 'base64'));
  
        overlayImage.resize(baseImage.bitmap.width, baseImage.bitmap.height);

        baseImage.composite(overlayImage, 0, 0, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 1,
          opacityDest: 1
        });
  
        const overlaidBase64 = await baseImage.getBase64Async(Jimp.MIME_JPEG);
        const cleanBase64 = overlaidBase64.replace(/^data:image\/(png|jpeg);base64,/, '');

        console.log('Overlayed image as base64:', cleanBase64);
        const payload = {
          name: "output.png",
          contents: cleanBase64,
          private: false 
        }
        axios.post(uploadEndpoint, payload)
        .then(response => {
    
          console.log("Response:", response.data);
          const fileURL = response.data;
          const httpsFileURL = `https:${fileURL}`;
          res.send({ httpsFileURL });
        })
        .catch(error => {
      
          console.error("Error:", error);
        });
        // Send the overlaid image as a response
      } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred while processing the request');
      }
    }

    overlayImages(imageUrl, overlayB64);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the request');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
