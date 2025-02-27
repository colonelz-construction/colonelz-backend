import fileuploadModel from "../../../models/adminModels/fileuploadModel.js";
import { responseData } from "../../../utils/respounse.js";
import { s3 } from "../../../utils/function.js"
import dotenv from "dotenv";
import orgModel from "../../../models/orgmodels/org.model.js";

dotenv.config();



function generateSixDigitNumber() {
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}

const uploadFile = async (file, org_id, fileName, folder_name, sub_folder_name_first, sub_folder_name_second) => {
     const  data = await s3.upload({
         Bucket: `${process.env.S3_BUCKET_NAME}/${org_id}/template/${folder_name}/${sub_folder_name_first}/${sub_folder_name_second}`,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
     
    }).promise();
    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: `${process.env.S3_BUCKET_NAME}/${org_id}/template/${folder_name}/${sub_folder_name_first}/${sub_folder_name_second}`,
        Key: fileName,
        Expires: 157680000 // URL expires in 5 year
    });
    return { status: true, data, signedUrl };
};

const saveFileUploadData = async (res, existingFileUploadData, isFirst = false) => {
    try {
        if (isFirst) {
            const firstFile = await fileuploadModel.create({
                org_id: existingFileUploadData.org_id,
                type: existingFileUploadData.type,
                files: [
                    {
                        folder_name: existingFileUploadData.folder_name,
                        sub_folder_name_first: existingFileUploadData.sub_folder_name_first,
                        sub_folder_name_second: existingFileUploadData.sub_folder_name_second,
                        folder_id: existingFileUploadData.folder_Id,
                        updated_date: existingFileUploadData.updated_Date,
                        files: existingFileUploadData.files,
                    },
                ],
            });
            responseData(res, "First file created successfully", 200, true);
        } else {
            let updateQuery = {};
            updateQuery = {
                $push: {
                    "files.$.files": { $each: existingFileUploadData.files },
                },
                $set: {
                    "files.$.updated_date": existingFileUploadData.updated_Date,
                }
            };


            const updateResult = await fileuploadModel.updateOne(
                {
                    org_id: existingFileUploadData.org_id,
                    type: existingFileUploadData.type,
                    "files.sub_folder_name_second": existingFileUploadData.sub_folder_name_second,
                    "files.folder_name": existingFileUploadData.folder_name,
                    "files.sub_folder_name_first": existingFileUploadData.sub_folder_name_first,
                },
                updateQuery,
                {
                    arrayFilters: [
                        { "folder.sub_folder_name_second": existingFileUploadData.sub_folder_name_second, },
                    ],
                }
            );

            if (updateResult.modifiedCount === 1) {
                responseData(res, "File data updated successfully", 200, true);
            } else {
                const firstFile = await fileuploadModel.create({
                    org_id: existingFileUploadData.org_id,
                    type: existingFileUploadData.type,

                    files: [
                        {
                            folder_name: existingFileUploadData.folder_name,
                            sub_folder_name_first: existingFileUploadData.sub_folder_name_first,
                            sub_folder_name_second: existingFileUploadData.sub_folder_name_second,
                            updated_date: existingFileUploadData.updated_Date,
                            folder_id: existingFileUploadData.folder_Id,
                            files: existingFileUploadData.files,
                        },
                    ],
                });

                responseData(res, "File data updated successfully", 200, true);


            }
        }
    } catch (error) {
        console.error("Error saving file upload data:", error);
        responseData(res, "", 500, false, "Something went wrong. File data not updated");
    }
};


export const templateFileUpload = async (req, res) => {
    const folder_name = req.body.folder_name;
    const sub_folder_name_first = req.body.sub_folder_name_first;
    const sub_folder_name_second = req.body.sub_folder_name_second;
    const type = req.body.type;
    const org_id = req.body.org_id;

    if (!folder_name || !sub_folder_name_first || !sub_folder_name_second || !type) {
        responseData(res, "", 403, false, "folder name, sub folder names, and type are required", []);
        return;
    }
    if(!org_id)
    {
        responseData(res, "", 403, false, "Org Id required!", []);
    }

    if (type !== "template") {
        responseData(res, "", 403, false, "Type must be 'template'", []);
        return;
    }

    try {
        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            responseData(res, "", 404, false, "Org not found!", []);
        }
        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

        if (!files || files.length === 0) {
            responseData(res, "", 400, false, "No files provided", []);
            return;
        }

        // Limit the number of files to upload to at most 5
        const filesToUpload = files.slice(0, 5);
        const fileUploadPromises = [];
        let fileSize = []

        for (const file of filesToUpload) {
            const fileName = file.name;
            const fileSizeInBytes = file.size;
            fileSize.push(fileSizeInBytes / 1024)
            fileUploadPromises.push(uploadFile(file, org_id, fileName,  folder_name, sub_folder_name_first, sub_folder_name_second));
        }

        const responses = await Promise.all(fileUploadPromises);
        const fileUploadResults = responses.map((response) => ({
            status: response.Location ? true : false,
            data: response ? response : response.err,
        }));
        const successfullyUploadedFiles = fileUploadResults.filter((result) => result.data);

        let fileUrls
        if (successfullyUploadedFiles.length > 0) {
            for (let i = 0; i < fileSize.length; i++) {
                fileUrls = successfullyUploadedFiles.map((result) => ({
                    fileUrl: result.data.signedUrl,
                    fileName: decodeURIComponent(result.data.data.Location.split('/').pop().replace(/\+/g, ' ')),
                    fileId: `FL-${generateSixDigitNumber()}`,
                    fileSize: `${fileSize[i]} KB`,
                    date: new Date()

                }));

            }


            if (folder_name === "commercial" || folder_name === "residential" || folder_name === "company data") {
                if (sub_folder_name_first === "designing" || sub_folder_name_first === "executing" || sub_folder_name_first === "company policies") {
                    const folder_Id = `FOL_ID${generateSixDigitNumber()}`;
                    const check_type = await fileuploadModel.findOne({
                        org_id: org_id,
                        type: type,
                        "files.folder_name": folder_name,
                        "files.sub_folder_name_first": sub_folder_name_first,
                    });

                    if (check_type) {
                        await saveFileUploadData(res, {
                            folder_name,
                            folder_Id,
                            org_id,
                            sub_folder_name_first,
                            sub_folder_name_second,
                            updated_Date: fileUrls[0].date,
                            type,
                            files: fileUrls,
                        });
                    } else {
                        await saveFileUploadData(res, {
                            folder_name,
                            folder_Id,
                            org_id,
                            sub_folder_name_first,
                            sub_folder_name_second,
                            updated_Date: fileUrls[0].date,
                            type,
                            files: fileUrls,
                        }, true);
                    }
                }
            }
        } else {
            responseData(res, "", 500, false, "Error uploading files", []);
        }
    } catch (err) {
        responseData(res, "", 500, false, err.message, []);
    }
};

export const getSingleTemplateFile = async (req, res) => {
    const file_id = req.query.file_id;
    const folder_id = req.query.folder_id;
    const org_id = req.query.org_id;

    if (!file_id) {
        responseData(res, "", 400, false, "file_id is required");
    }
    else if (!folder_id) {
        responseData(res, "", 400, false, "folder_id is required");
    }
    else if(!org_id)
    {
        responseData(res, "", 400, false, "Org Id is required");
    }
    else {
        try {
            const check_org = await orgModel.findOne({ _id: org_id })
            if (!check_org) {
                responseData(res, "", 404, false, "Org not found!", []);
            }
            const find_data = await fileuploadModel.find({ "files.folder_id": folder_id, org_id: org_id })
            if (find_data.length > 0) {

                const find_folder = find_data[0].files.find((file) =>
                    file.folder_id === folder_id

                )
                if (find_folder) {

                    const find_file = find_folder.files.find((file) =>
                        file.fileId == file_id
                    )
                    if (find_file) {
                        responseData(res, "file found", 200, true, "", find_file);
                    }
                    else {
                        responseData(res, "", 404, false, "file not found");
                    }
                }
                else {
                    responseData(res, "", 404, false, "folder not found");
                }

            }
            if (find_data.length < 1) {
                responseData(res, "", 404, false, "data not found");
            }



        }
        catch (error) {
            console.log(error)
            responseData(res, "", 500, false, "something went wrong", error.msg)
        }
    }
}
