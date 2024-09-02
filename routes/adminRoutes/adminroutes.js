import { Router } from "express";
const router = Router();

import fileupload from "../../controllers/adminControllers/fileUploadController/fileuploadController.js";

import { getCompanyData, getFileData, getleadData, getprojectData } from "../../controllers/adminControllers/fileUploadController/getFileController.js";
import getSingleFileData from "../../controllers/adminControllers/fileUploadController/getSingleFileController.js";

import {
  createmom,
  getAllMom,
  getAllProjectMom,
  getSingleMom,
  sendPdf,
  updateMom,
} from "../../controllers/adminControllers/momControllers/mom.controller.js";
import {
  createLead,
  getAllLead,
  getSingleLead,
  leadToMultipleProject,
  leadToProject,
  updateFollowLead,
  updateLead,
} from "../../controllers/adminControllers/leadController/lead.controller.js";
import {
  getAllProject,
  getSingleProject,
  updateProjectDetails,
} from "../../controllers/adminControllers/projectController/project.controller.js";
import {
  getQuotationData,

} from "../../controllers/adminControllers/quotationController/getQuotation.controller.js";

import { contractShare } from "../../controllers/adminControllers/fileUploadController/contract.controller.js";
import { getNotification, updateNotification } from "../../controllers/notification/notification.controller.js";
import projectFileUpload from "../../controllers/adminControllers/fileUploadController/project.file.controller.js";
import { shareFile } from "../../controllers/adminControllers/fileUploadController/share.files.controller.js";
import { getSingleTemplateFile, templateFileUpload } from "../../controllers/adminControllers/fileUploadController/template.controller.js";
import { deleteFile, deleteFolder } from "../../controllers/adminControllers/fileUploadController/delete.file.controller.js";
import { shareQuotation, updateStatus, updateStatusAdmin } from "../../controllers/adminControllers/quotationController/quotation.approval.controller.js";
import { archiveUser, createUser, deleteUser, deleteUserArchive, getUser, restoreUser } from "../../controllers/adminControllers/createuser.controllers/createuser.controller.js";
import { addMember, listUserInProject, removeMemberInProject } from "../../controllers/adminControllers/projectController/addmember.project.controller.js";
import { checkAvailableUserIsAdmin, checkAvailableUserIsAdminInFile, checkAvailableUserIsAdminInLead, checkAvailableUserIsAdminInMom, checkAvailableUserIsAdmininProject, isAdmin } from "../../middlewares/auth.middlewares.js";


import { verifyJWT } from "../../middlewares/auth.middlewares.js";
import { contractStatus, getContractData, shareContract } from "../../controllers/adminControllers/fileUploadController/contract.share.controller.js";
import { AddMemberInLead, listUserInLead, removeMemberInlead } from "../../controllers/adminControllers/leadController/addmemberinlead.controller.js";
import { archive, deletearchive, restoreData } from "../../controllers/adminControllers/archiveControllers/archive.controller.js";
import { createTask, deleteTask, getAllTaskWithData, getAllTasks, getSingleTask, updateTask } from "../../controllers/adminControllers/taskControllers/task.controller.js";
import { createSubTask, deleteSubTask, getAllSubTask, getSingleSubTask, updateSubTask } from "../../controllers/adminControllers/taskControllers/subtask.controller.js";
import { GetSingleSubtimerController, UpdateSubtimerController } from "../../controllers/adminControllers/timerControllers/timer.controller.js";
import { getProjectUser, getUserList, userAcessLeadOrProjectList } from "../../controllers/adminControllers/createuser.controllers/getuser.controller.js";
import { createAddMember, createContractAccess, createLeadAccess, createMomAccess, createProjectAccess, createQuotationAccess, CreateRoleAccess, createTaskAccess,  CreateUserAccess, deleteAddMember, deleteArchiveAccess, deleteArchiveUserAccess, deletedFileAccess, deleteRole, deleteTskAccess, deleteUserAccess, GetArchiveUser, GetRole, GetUser, readArchiveAccess, readContractAccess, readFileAccess, readFileCompanyDataAccess, readLeadAccess, readMomAccess, readProjectAccess, readQuotationAccess, readTaskAccess, restoreArchiveAccess, restoreUserAccess, updateContractAccess, updateLeadAccess, updateProjectAccess, updateQuotationAccess, updateRole, updateTaskAccess } from "../../middlewares/access.middlewares.js";
import { createRole, DeleteRole, getRole, roleName, roleWiseAccess, UpdateRole } from "../../controllers/adminControllers/createRoleControllers/role.controllers.js";
import { verify } from "crypto";

// router.use(checkAvailableUserIsAdmin)

/**
 * @swagger
 * /v1/api/admin/create/user:
 *   post:
 *     summary: Create a new user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Data for creating a user
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/create/user").post(verifyJWT, CreateUserAccess, createUser);

router.route("/add/member").post(verifyJWT,createAddMember, addMember);
/**
 * @swagger
 * /v1/api/admin/get/alluser:
 *   get:
 *     summary: all active user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64c9e9f9c125f2a9a5b5d2d1"
 *         description: The unique identifier of the user
 *     responses:
 *       200:
 *         description: User fetched  successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/get/alluser").get(verifyJWT, GetUser, getUser);
/**
 * @swagger
 * /v1/api/admin/delete/user:
 *   delete:
 *     summary: Soft delete a user and store in archive
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "64c9e9f9c125f2a9a5b5d2d1"
 *         description: The unique identifier of the user to be deleted
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

router.route("/delete/user").delete(verifyJWT,  deleteUserAccess, deleteUser);

router.route("/get/userlist").get(verifyJWT, getUserList);
/**
 * @swagger
 * /v1/api/admin/archive/user:
 *   get:
 *     summary: all archive user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User fetched  successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/archive/user").get(verifyJWT,GetArchiveUser, archiveUser);
/**
 * @swagger
 * /v1/api/admin/restore/user:
 *   post:
 *     summary: restore user from archive
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: restore user from archive
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "64c9e9f9c125f2a9a5b5d2d1"
 
 *     responses:
 *       200:
 *         description: User restore successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/restore/user").post(verifyJWT,restoreUserAccess, restoreUser);
/**
 * @swagger
 * /v1/api/admin/delete/archive/user:
 *   delete:
 *     summary:  delete a user from archive
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64c9e9f9c125f2a9a5b5d2d1"
 *         description: The unique identifier of the user to be deleted
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.route("/delete/archive/user").delete(verifyJWT, deleteArchiveUserAccess, deleteUserArchive);

router.route("/user/access/list").get(verifyJWT, userAcessLeadOrProjectList)


router.route("/fileupload").post(verifyJWT, fileupload);
router.route("/getfile").get(verifyJWT, readFileAccess, checkAvailableUserIsAdminInFile,  getFileData);
router.route("/get/onefile").get(verifyJWT, readFileAccess, getSingleFileData);
router.route("/lead/getfile").get(verifyJWT,readLeadAccess, getleadData);
router.route("/project/getfile").get(verifyJWT,readProjectAccess, getprojectData);
router.route("/project/fileupload").post(verifyJWT, projectFileUpload);
router.route("/view/contract").post(verifyJWT,readContractAccess, contractShare);
router.route("/share/file").post(verifyJWT, shareFile);
router.route("/template/fileupload").post(verifyJWT, templateFileUpload);
router.route("/template/single/file").get(verifyJWT,readFileCompanyDataAccess, getSingleTemplateFile);
router.route("/delete/file").delete(verifyJWT,deletedFileAccess, deleteFile);
router.route("/share/contract").post(verifyJWT,createContractAccess, shareContract);
router.route("/contract/approval").post(verifyJWT, updateContractAccess, contractStatus);
router.route("/get/contractdata").get(verifyJWT,readContractAccess, getContractData);
router.route("/delete/folder").delete(verifyJWT,deletedFileAccess, deleteFolder);
router.route("/get/companyData").get(verifyJWT,readFileCompanyDataAccess, getCompanyData);



/**
 * @swagger
 * /v1/api/admin/getall/project:
 *   get:
 *     summary: all project Details
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64c9e9f9c125f2a9a5b5d2d1"
 *         description: The unique identifier of the user
 *     responses:
 *       200:
 *         description: Project data fetched  successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/getall/project").get(verifyJWT, readProjectAccess, checkAvailableUserIsAdmininProject,  getAllProject);
/**
 * @swagger
 * /v1/api/admin/getsingle/project:
 *   get:
 *     summary: Get single project details
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64c9e9f9c125f2a9a5b5d2d1"
 *         description: The unique identifier of the user
 *       - in: query
 *         name: project_id
 *         required: true
 *         schema:
 *           type: string
 *           example: "COLP-123456"
 *         description: The unique identifier of the project
 *     responses:
 *       200:
 *         description: Project details fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

router.route("/getsingle/project").get(verifyJWT,readProjectAccess, getSingleProject);

router.route("/update/project").put(verifyJWT,updateProjectAccess, updateProjectDetails);
router.route("/remove/member/project").post(verifyJWT,deleteAddMember, removeMemberInProject);
router.route("/get/user/project").get(verifyJWT, getProjectUser);
router.route("/get/userlist/project/").get(verifyJWT, listUserInProject);


router.route("/create/lead").post(verifyJWT,createLeadAccess, createLead);
router.route("/getall/lead").get(verifyJWT, readLeadAccess, checkAvailableUserIsAdminInLead,  getAllLead);
router.route("/getsingle/lead").get(verifyJWT, readLeadAccess, getSingleLead);
router.route("/update/lead").put(verifyJWT, updateLeadAccess, updateFollowLead);
router.route("/create/lead/project").post(verifyJWT, createProjectAccess, leadToProject);
router.route("/add/member/lead").post(verifyJWT,createAddMember, AddMemberInLead);
router.route("/update/lead/data").put(verifyJWT,updateLeadAccess, updateLead);
router.route("/lead/multiple/project").post(verifyJWT, createProjectAccess, leadToMultipleProject);
router.route("/remove/member/lead").post(verify,deleteAddMember, removeMemberInlead);
router.route("/get/userlist/lead").get(verifyJWT, listUserInLead);

router.route("/create/mom").post(verifyJWT,createMomAccess, createmom);
router.route("/getall/mom").get(verifyJWT,readMomAccess, getAllMom);
router.route("/getsingle/mom").get(verifyJWT,readMomAccess, getSingleMom);
router.route("/getall/project/mom").get(verifyJWT, readMomAccess, checkAvailableUserIsAdminInMom, getAllProjectMom);
router.route("/send/momdata").post(verifyJWT, sendPdf);
router.route("/update/mom").put(verifyJWT, updateMom);


router.route("/share/quotation").post(verifyJWT, readQuotationAccess, shareQuotation);
router.route("/get/quotationdata").get(verifyJWT, readQuotationAccess, getQuotationData);
router.route("/quotation/approval").post(verifyJWT, updateQuotationAccess, updateStatusAdmin);




router.route("/get/notification").get(verifyJWT, checkAvailableUserIsAdmin, getNotification);
router.route("/update/notification").put(verifyJWT, updateNotification);


router.route("/get/archive").get(verifyJWT, readArchiveAccess, archive);
router.route("/delete/archive").delete(verifyJWT, deleteArchiveAccess, deletearchive);
router.route("/restore/file").post(verifyJWT, restoreArchiveAccess, restoreData);


router.route("/create/task").post(verifyJWT,createTaskAccess, createTask);
router.route("/get/all/task").get(verifyJWT,readTaskAccess, getAllTasks);
router.route("/get/single/task").get(verifyJWT,readTaskAccess, getSingleTask);
router.route("/update/task").put(verifyJWT,updateTaskAccess, updateTask);
router.route("/delete/task").delete(verifyJWT,deleteTskAccess, deleteTask);
router.route("/gettask/details").get(verifyJWT,readProjectAccess, getAllTaskWithData);


router.route("/create/subtask").post(verifyJWT, createSubTask);
router.route("/get/all/subtask").get(verifyJWT, getAllSubTask);
router.route("/get/single/subtask").get(verifyJWT, getSingleSubTask);
router.route("/update/subtask").put(verifyJWT, updateSubTask);
router.route("/delete/subtask").delete(verifyJWT, deleteSubTask);
router.route("/update/subtask/time").put(verifyJWT, UpdateSubtimerController);
router.route("/get/subtask/time").get(verifyJWT, GetSingleSubtimerController);



router.route("/create/role").post(verifyJWT, CreateRoleAccess, createRole);
router.route("/get/role").get(verifyJWT,GetRole, getRole );
router.route("/update/role").put(verifyJWT, updateRole,UpdateRole );
router.route("/delete/role").delete(verifyJWT, deleteRole, DeleteRole);
router.route("/rolewise/access").get(verifyJWT, roleWiseAccess);
router.route("/get/rolename").get(verifyJWT, roleName);







export default router;
