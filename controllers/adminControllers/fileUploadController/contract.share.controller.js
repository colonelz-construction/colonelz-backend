import { responseData } from "../../../utils/respounse.js";
import fileuploadModel from "../../../models/adminModels/fileuploadModel.js";
import registerModel from "../../../models/usersModels/register.model.js";
import leadModel from "../../../models/adminModels/leadModel.js";
import { onlyAlphabetsValidation, onlyEmailValidation } from "../../../utils/validation.js";
import { admintransporter, s3 } from "../../../utils/function.js"
import orgModel from "../../../models/orgmodels/org.model.js";



function generateSixDigitNumber() {
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomNumber;
}


const storeOrUpdateContract = async (res, existingContractData, isFirst = false) => {
    try {
        if (isFirst) {
            const updatedLead = await leadModel.findOneAndUpdate(
                { lead_id: existingContractData.lead_id, org_id: existingContractData.org_id },
                {
                    $push: { "contract": existingContractData.contractData }
                },
                { new: true } // Return the updated document
            );
            return responseData(res, `Contract shared successfully`, 200, true, "");

        }
        else {
            const check_lead = await leadModel.findOne({ lead_id: existingContractData.lead_id, org_id: existingContractData.org_id });
            if (check_lead) {
                const updatedLead = await leadModel.findOneAndUpdate(
                    { lead_id: existingContractData.lead_id, org_id: existingContractData.org_id },
                    {
                        $push: {
                            "contract": existingContractData.contractData
                        }
                    }
                )
                return responseData(res, `Contract shared successfully`, 200, true, "");
            }
        }
    }
    catch (err) {
        return responseData(res, "", 403, false, "Error occured while storing contract");
    }

}

const uploadImage = async (req, file, lead_id, org_id, fileName) => {

    if (typeof fileName !== 'string') {
        fileName = String(fileName);
    }
    // console.log(file)
    const data = await s3
        .upload({
            Bucket: `${process.env.S3_BUCKET_NAME}/${org_id}/${lead_id}/Quotation`,
            Key: fileName,
            Body: file.data,
            ContentType: file.mimetype,
           
        })
        .promise();
            
            const signedUrl = s3.getSignedUrl('getObject', {
                Bucket: `${process.env.S3_BUCKET_NAME}/${org_id}/${lead_id}/Quotation`,
                Key: fileName,
                Expires: 157680000 // URL expires in 5 year
            });
            return { status: true, data, signedUrl };
        
};

const saveFileUploadData = async (
    res,
    existingFileUploadData,

) => {
    try {


        // Use update query to push data
        const updateResult = await fileuploadModel.updateOne(
            {
                lead_id: existingFileUploadData.lead_id,
                org_id: existingFileUploadData.org_id,
                "files.folder_name": existingFileUploadData.folder_name,
            },
            {
                $set: {
                    "files.$.updated_date": existingFileUploadData.updated_Date,
                },
                $push: {

                    "files.$.files": { $each: existingFileUploadData.files },
                },
            },
            {
                arrayFilters: [
                    { "folder.folder_name": existingFileUploadData.folder_name },
                ],
            }
        );

        if (updateResult.modifiedCount === 1) {
            console.log("File Upload Data Updated Successfully");
        } else {
            // If the folder does not exist, create a new folder object
            const updateNewFolderResult = await fileuploadModel.updateOne(
                { lead_id: existingFileUploadData.lead_id, org_id: existingFileUploadData.org_id, },
                {
                    $push: {
                        files: {
                            folder_name: existingFileUploadData.folder_name,
                            updated_date: existingFileUploadData.updated_date,
                            files: existingFileUploadData.files,
                        },
                    },
                }
            );

            if (updateNewFolderResult.modifiedCount === 1) {
                console.log("New Folder Created and File Upload Data Updated Successfully");
            } else {
                console.log("Lead not found or file data already updated");
                responseData(
                    res,
                    "",
                    404,
                    false,
                    "Lead not found or file data already updated"
                );
            }
        }

    } catch (error) {
        console.error("Error saving file upload data:", error);
        responseData(
            res,
            "",
            500,
            false,
            "Something went wrong. File data not updated"
        );
    }
};


export const shareContract = async (req, res) => {
    try {
        const folder_name = req.body.folder_name;
        const fileId = req.body.file_id;
        const lead_id = req.body.lead_id;
        const type = req.body.type;
        const client_email = req.body.email;
        const client_name = req.body.client_name;
        const project_name = req.body.project_name;
        const site_location = req.body.site_location;
        const org_id = req.body.org_id;



        if (!folder_name || !fileId || !lead_id || !org_id) {
            return responseData(res, "", 400, false, "Please enter all fields");
        }

        else {
            const check_org = await orgModel.findOne({ _id: org_id })
            if (!check_org) {
                return responseData(res, "", 404, false, "Org not found");
            }
            if (type === 'Internal') {
               
                const check_lead = await leadModel.findOne({ lead_id: lead_id, org_id: org_id  });
                if (!check_lead) {
                    return responseData(res, "", 400, false, "Lead not found");
                }
                else {

                    const check_status1 = await leadModel.findOne({ lead_id: lead_id,  org_id: org_id, "contract.itemId": fileId, "contract.admin_status": "pending" });
                    if (check_status1) {
                        return responseData(res, "", 400, false, "This Contract not  closed yet");
                    }
                    const check_status2 = await leadModel.findOne({ lead_id: lead_id, org_id: org_id, "contract.itemId": fileId, "contract.admin_status": "rejected" });
                    if (check_status2) {
                        return responseData(res, "", 400, false, "This Contract rejected");
                    }
                    const check_status3 = await leadModel.findOne({ lead_id: lead_id, org_id: org_id, "contract.itemId": fileId, "contracts.admin_status": "approved" });
                    if (check_status3) {
                        return responseData(res, "", 400, false, "This Contract approved");
                    }



                    const check_file = await fileuploadModel.findOne({ "files.files.fileId": fileId, org_id: org_id });
                    if (!check_file) {
                        return responseData(res, "", 400, false, "File not found");
                    }
                    else {


                        const file_url = check_file.files.find(x => x.folder_name === folder_name)?.files.find(file => file.fileId === fileId);

                        const contractData = {
                            itemId: fileId,
                            admin_status: "pending",
                            file_name: file_url.fileName,
                            files: file_url,
                            remark: "",

                        };

                        if (check_lead.contract.length < 1) {

                            const createObj = {
                                lead_id,
                                org_id,
                                contractData,
                            }

                            await storeOrUpdateContract(res, createObj, true);
                        }
                        else {
                            const createObj = {
                                lead_id,
                                org_id,
                                contractData,


                            }
                            await storeOrUpdateContract(res, createObj);

                        }
                    }

                }

            }
            else if (type === 'Client') {
                // Input validation
                if (!client_email || !onlyEmailValidation(client_email)) {
                    return responseData(res, "", 400, false, "Please enter a valid client email");
                }
                if (!client_name || client_name.length < 3) {
                    return responseData(res, "", 400, false, "Please enter a valid client name");
                }
                if (project_name && !onlyAlphabetsValidation(project_name)) {
                    return responseData(res, "", 400, false, "Please enter a valid project name");
                }
                if (!site_location || site_location.length < 5) {
                    return responseData(res, "", 400, false, "Please enter a valid site location");
                }

                // Check lead existence
                const check_lead = await leadModel.findOne({ lead_id, org_id });
                if (!check_lead) {
                    return responseData(res, "", 400, false, "Invalid lead id");
                }

                // Check file existence
                const check_file = await fileuploadModel.findOne({ "files.files.fileId": fileId, org_id: org_id });
                if (!check_file) {
                    return responseData(res, "", 400, false, "File not found");
                }

                const file_url = check_file.files.find(x => x.folder_name === 'Contract')?.files.find(file => file.fileId === fileId);
                const quotation = req.files.quotation;

                if (!quotation) {
                    return responseData(res, "", 400, false, "Quotation file not uploaded");
                }

                // Upload quotation image
                const response = await uploadImage(req, quotation, lead_id,org_id, quotation.name);
                if (!response.status) {
                    return responseData(res, "", 400, false, "Failed to upload quotation");
                }

                // Prepare file URLs
                const fileUrls = [{
                    fileUrl: response.signedUrl,
                    fileName: decodeURIComponent(response.data.Location.split('/').pop().replace(/\+/g, ' ')),
                    fileId: `FL-${generateSixDigitNumber()}`,
                    fileSize: `${quotation.size / 1024} KB`,
                    date: new Date()
                }];

                const existingFile = await fileuploadModel.findOne({ lead_id, org_id });
                if (existingFile) {
                    const mailOptions = {
                        from: process.env.INFO_USER_EMAIL,
                        to: client_email,
                        subject: "Contract Share Notification",
                        html: createEmailBody(client_name, project_name, site_location, file_url.fileUrl, response.signedUrl)
                    };

                    admintransporter.sendMail(mailOptions, async (error) => {
                        if (error) {
                            return responseData(res, "", 400, false, "Failed to send email");
                        }

                        await saveFileUploadData(res, {
                            lead_id,
                            org_id,
                            lead_Name: existingFile.lead_name,
                            folder_name: "Quotation",
                            updated_date: new Date(),
                            files: fileUrls,
                        });

                        return responseData(res, "Email sent successfully", 200, true, "");
                    });
                }
            }
            else {
                return responseData(res, "", 400, false, "Invalid Type");
            }
        }


    }
    catch (err) {

    }
}

function createEmailBody(client_name, project_name, site_location, contractUrl, estimateUrl) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            .content { margin-bottom: 20px; }
            .note { font-style: italic; color: #555; }
        </style>
    </head>
    <body>
        <p>Dear <strong>${client_name}</strong>,</p>
        <p>Hope you're doing well!</p>
       <p>We appreciate your expressed interest in our services. Thank you for dedicating your time to the last call / meeting, it greatly aided in our comprehension of your requirements in your <strong>${project_name}</strong>.</p>
        <p>PFA for your kind perusal:</p>
        <ul>
            <li>Design Consultation Draft Contract - <a href="${contractUrl}">View and Download Contract</a></li>
            <li>Tentative Project Estimate - <a href="${estimateUrl}">View and Download Project Estimate</a></li>
        </ul>
     <p>We look forward to the prospect of a successful collaboration for your <strong>${project_name}</strong> at <strong>${site_location}</strong>. Please feel free to call if you have any questions or concerns.</p>
        <p class="note">Kindly note:</p>
          <ul class="note">
        <li>A separate detailed estimate will be provided post-design finalization.</li>
        <li>This estimate is meant to give you a general idea of potential costs. The final expenses will depend on the design, materials, and finishes finalized with you. Any alterations in design due to site requirements or client requests will have an impact on the estimate and the project timeline, which will be promptly updated. The final estimate will be as actuals.</li>
        <li>The project timeline will depend on the final scope of work, which will be updated in the contract.</li>
    </ul>
    </body>
    </html>`;
}

export const updateStatusAdmin = async (req, res) => {
    try {
        const file_id = req.query.fileId;
        const lead_id = req.query.lead_id;
        const status = req.query.status;
        const org_id = req.query.org_id;

        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            return responseData(res, "", 404, false, "Org not found");
        }
        const check_status = await leadModel.findOne({ lead_id: lead_id, org_id: org_id })
        if (check_status) {

            for (let i = 0; i < check_status.contract.length; i++) {
                if (check_status.contract[i].itemId == file_id) {

                    if (check_status.contract[i].admin_status !== 'pending') {
                        return responseData(res, "", 404, false, "You already submit your response");
                    }
                    else {
                        try {

                            const filter = { "data.quotationData.contract_file_id": file_id, organization: org_id };
                            const update = {
                                $set: { "data.$[outerElem].quotationData.$[innerElem].approval_status": status }
                            };
                            const options = {
                                arrayFilters: [
                                    { "outerElem.quotationData": { $exists: true } },
                                    { "innerElem.contract_file_id": file_id }
                                ],
                                new: true
                            };

                            const userUpdate = await registerModel.findOneAndUpdate(filter, update, options);
                            console.log(userUpdate)

                        } catch (error) {
                            console.error("Error updating document:", error);
                        }
                        if (status == 'approved') {
                            await leadModel.findOneAndUpdate(
                                {
                                    lead_id: lead_id,
                                    org_id: org_id,
                                    "contract.$.itemId": file_id
                                },
                                {
                                    $set: {
                                        "contract.$[elem].admin_status": status,

                                    }
                                },
                                {
                                    arrayFilters: [{ "elem.itemId": file_id }],
                                    new: true
                                }

                            );
                            res.send('Quotation approved successfully!');

                        }
                        if (status === 'rejected') {
                            await leadModel.findOneAndUpdate(
                                {
                                    lead_id: lead_id,
                                    org_id: org_id,
                                    "contract.$.itemId": file_id
                                },
                                {
                                    $set: {
                                        "contract.$[elem].admin_status": status,

                                    }
                                },
                                {
                                    arrayFilters: [{ "elem.itemId": file_id }],
                                    new: true
                                }
                            );
                            res.send('Quotation rejected successfully!');
                        }
                    }
                }

            }
        }
        else {
            return responseData(res, "", 404, false, "No lead found with this lead_id");
        }

    }
    catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Something went wrong while approving the Contract");

    }





}


export const contractStatus = async (req, res) => {
    try {
        const status = req.body.status;
        const lead_id = req.body.lead_id;
        const itemId = req.body.file_id;
        const remark = req.body.remark;
        const org_id = req.body.org_id;
        
        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            return responseData(res, "", 404, false, "Org not found");
        }
        const check_status = await leadModel.findOne({
            lead_id: lead_id, org_id: org_id,
            "contract.$.itemId": itemId
        })
        for (let i = 0; i < check_status.contract.length; i++) {
            if (check_status.contract[i].itemId == itemId) {
                if (check_status.contract[i].admin_status !== "pending") {

                    return responseData(res, "", 400, false, "you are already submit your response");
                }
                else {
                    try {
                        const filter = { "data.quotationData.contract_file_id": itemId, organization: org_id, };
                        const update = {
                            $set: { "data.$[outerElem].quotationData.$[innerElem].approval_status": status }
                        };
                        const options = {
                            arrayFilters: [
                                { "outerElem.quotationData": { $exists: true } },
                                { "innerElem.contract_file_id": itemId }
                            ],
                            new: true
                        };

                        const userUpdate = await registerModel.findOneAndUpdate(filter, update, options);


                    } catch (error) {
                        console.error("Error updating document:", error);
                    }



                    if (status == 'approved') {
                        await leadModel.findOneAndUpdate(
                            {
                                lead_id: lead_id,
                                org_id: org_id,
                                "contract.$.itemId": itemId
                            },
                            {
                                $set: {
                                    "contract.$[elem].admin_status": status,

                                }
                            },
                            {
                                arrayFilters: [{ "elem.itemId": itemId }],
                                new: true
                            }

                        );
                        responseData(res, "Contract  approved Successfully", 200, true, "");

                    }
                    if (status === 'rejected') {
                        await leadModel.findOneAndUpdate(
                            {
                                lead_id: lead_id,
                                org_id: org_id,
                                "contract.$.itemId": itemId
                            },
                            {
                                $set: {
                                    "contract.$[elem].admin_status": status,
                                    "contract.$[elem].remark": remark

                                }
                            },
                            {
                                arrayFilters: [{ "elem.itemId": itemId }],
                                new: true
                            }
                        );
                        responseData(res, "COntract  rejected Successfully", 200, true, "");
                    }
                }
            }

        }

    }
    catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Something went wrong while approving the contract");
    }
}


export const getContractData = async (req, res) => {
    try {
        const lead_id = req.query.lead_id;
        const org_id = req.query.org_id;

        if (!lead_id) {
            return responseData(res, "", 400, false, "Lead id is required");
        }
        else if(!org_id)
        {
            return responseData(res, "", 400, false, "Org id is required");
        }
        else {
            const check_org = await orgModel.findOne({ _id: org_id })
            if (!check_org) {
                return responseData(res, "", 404, false, "Org not found");
            }
            const contractData = await leadModel.find({ lead_id: lead_id, org_id: org_id })
            if (contractData) {

                return responseData(res, "Contract data fetched successfully", 200, true, "", contractData[0].contract);
            }
            else {
                return responseData(res, "", 400, false, "No contract found");
            }


        }


    }
    catch (err) {
        responseData(res, "", 500, false, "Something went wrong while getting the contract");
    }
}













