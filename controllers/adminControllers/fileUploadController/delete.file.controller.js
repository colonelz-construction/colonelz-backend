import fileuploadModel from "../../../models/adminModels/fileuploadModel.js";
import Archive from "../../../models/adminModels/archive.model.js";
import { responseData } from "../../../utils/respounse.js";
import orgModel from "../../../models/orgmodels/org.model.js";


export const deleteFile = async (req, res) => {
    const { org_id, lead_id, project_id, folder_name, file_id: fileIds, type } = req.body;

    // console.log('fileid', fileIds)

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return responseData(res, "", 400, false, "Please provide an array of fileIds");
    }

    if (!folder_name) {
        return responseData(res, "", 400, false, "Please Enter Folder Name");
    }
    if(!org_id)
    {
        return responseData(res, "", 400, false, "Org Id  required");
    }

    try {
        let count = 0;
        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            responseData(res, "", 404, false, "Org not found!", []);
        }

        for (const fileId of fileIds) {
            const query = type === "template"
                ? { "files.sub_folder_name_second": folder_name, "files.files.fileId": fileId, org_id:org_id }
                : { $or: [{ project_id }, { lead_id }], "files.folder_name": folder_name, "files.files.fileId": fileId, org_id: org_id };

            const filesData = await fileuploadModel.findOne(query);

            if (!filesData) continue;

            const fileGroup = filesData.files.find(group => group.files.some(file => file.fileId === fileId));
            if (!fileGroup) continue;

            const file = fileGroup.files.find(file => file.fileId === fileId);
            const updateQuery = type === "template"
                ? { "files.sub_folder_name_second": folder_name, "files.files.fileId": fileId, org_id:org_id  }
                : { $or: [{ project_id }, { lead_id }], "files.folder_name": folder_name, 'files.files.fileId': fileId, org_id: org_id };

            // console.log(updateQuery);
            

            const filesDatas = await fileuploadModel.findOne(query);

            // console.log("Before Update:", filesDatas);
            const data = await fileuploadModel.findOneAndUpdate(
                updateQuery,
                { $pull: { "files.$[].files": { fileId } } },
                { new: true }
            );
            // console.log("After Update:", data.files[0].files);

            if (data) {
                const archiveData = {
                    lead_id,
                    org_id,
                    lead_name: type === "template" ? "" : (lead_id ? data.lead_name : ""),
                    project_name: type === "template" ? "" : (project_id ? data.project_name : ""),
                    project_id,
                    folder_name: type === "template" ? data.files[0]?.folder_name : folder_name,
                    sub_folder_name_first: type === "template" ? data.files[0]?.sub_folder_name_first : undefined,
                    sub_folder_name_second: type === "template" ? folder_name : undefined,
                    files: [file],
                    type,
                    deleted_type: "file"
                };

                await Archive.create(archiveData);
                count++;
            }
        }

        const message = count > 0 ? "Files moved to archive successfully" : "No files found";
        responseData(res, message, 200, count > 0, "", []);

    } catch (error) {
        console.error(error);
        responseData(res, "", 500, false, "Something went wrong", []);
    }
};


export const deleteFolder = async (req, res) => {
    const { lead_id, org_id, project_id, folder_name, type } = req.body;

    if (!folder_name) {
        return responseData(res, "", 400, false, "Please Enter Folder Name");
    }
    if(!org_id){
        return responseData(res, "", 400, false, "Org Id  required"); 
    }

    try {
        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            responseData(res, "", 404, false, "Org not found!", []);
        }
        let folder, data;
        const query = type === "template"
            ? {
                org_id: org_id,
                "files.folder_name": folder_name,
                "files.sub_folder_name_first": req.body.sub_folder_name_first,
                "files.sub_folder_name_second": req.body.sub_folder_name_second
            }
            : {
                $or: [{ project_id }, { lead_id }],
                "files.folder_name": folder_name, org_id: org_id
            };

        const folderData = await fileuploadModel.findOne(query);
        if (!folderData) {
            return responseData(res, "No folder found", 200, false, "", []);
        }

        folder = folderData.files.find(fileGroup =>
            type === "template"
                ? fileGroup.folder_name === folder_name &&
                fileGroup.sub_folder_name_first === req.body.sub_folder_name_first &&
                fileGroup.sub_folder_name_second === req.body.sub_folder_name_second
                : fileGroup.folder_name === folder_name
        );

        data = await fileuploadModel.findOneAndUpdate(
            query,
            { $pull: { "files": { folder_name } } },
            { new: true }
        );

        if (data) {
            const archiveData = {
                lead_id,
                org_id,
                lead_name: type === "template" ? "" : (lead_id ? data.lead_name : ""),
                project_name: type === "template" ? "" : (project_id ? data.project_name : ""),
                project_id,
                folder_name: type === "template" ? folder.folder_name : folder_name,
                sub_folder_name_first: type === "template" ? folder.sub_folder_name_first : undefined,
                sub_folder_name_second: type === "template" ? folder.sub_folder_name_second : undefined,
                files: [folder],
                type,
                deleted_type: "folder"
            };

            await Archive.create(archiveData);
            return responseData(res, "Folder moved to archive successfully", 200, true, "", []);
        }

        responseData(res, "No folder found", 200, false, "", []);
    } catch (error) {
        console.error(error);
        responseData(res, "", 500, false, "Something went wrong", []);
    }
};

