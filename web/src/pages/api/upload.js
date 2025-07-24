// frontend/pages/api/upload.js
import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import multiparty from "multiparty";

export const config = { api: { bodyParser: false } };

const PINATA_JWT = process.env.PINATA_JWT;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }
  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Form parse error" });
      return;
    }

    try {
      const img = files.file[0];
      const stream = fs.createReadStream(img.path);
      const imgForm = new FormData();
      imgForm.append("file", stream, img.originalFilename);

      const imgRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        imgForm,
        {
          maxBodyLength: Infinity,
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            ...imgForm.getHeaders(),
          },
        }
      );
      const imgCID = imgRes.data.IpfsHash;
      const imgURI = `ipfs://${imgCID}`;

      const imgFilename = img.originalFilename || 'file'
      const metadata = {
        name: fields.name?.[0] || "",
        description: fields.description?.[0] || "",
        image: imgURI,
      };

      const jsonPayload = {
        pinataMetadata: {
          name: `metadata-${imgFilename}`
        },
        pinataContent: metadata
      };

      const jsonRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        jsonPayload,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            "Content-Type": "application/json",
          },
        }
      );
      const jsonCID = jsonRes.data.IpfsHash;
      const jsonURI = `ipfs://${jsonCID}`;

      res.status(200).json({ uri: jsonURI });
    } catch (error) {
      console.error(error.response?.data || error);
      res.status(500).json({ error: "Pinata upload failed" });
    }
  });
}
