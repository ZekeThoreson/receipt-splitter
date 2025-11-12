const { getAxiosInstance } = require("./axios");
const { errorHandler } = require("./helpers");

const axiosInstance = getAxiosInstance(
    "https://api.veryfi.com/api/v8/partner/documents",
    {
        "Content-Type": "application/json",
        Accept: "application/json",
        "CLIENT-ID": process.env.local.OCR_VERIFY_CLIENT_ID,
        AUTHORIZATION: process.env.OCR_VERIFY_AUTHORIZATION,
    }
);

async function processTheReceipt(fileUrl) {
    return new Promise((resolve, reject) => {
        axiosInstance
            .post("documents", {
                file_url: fileUrl,
            })
            .then((response) => {
                console.log(response);
                resolve(response);
            })
            .catch((ex) => {
                errorHandler(ex, "processTheReceipt", "axios");
                reject(ex);
            });
    });
}

module.exports = { processTheReceipt}