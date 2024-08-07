import projectModel from "../../../models/adminModels/project.model.js";
import { responseData } from "../../../utils/respounse.js";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import registerModel from "../../../models/usersModels/register.model.js";
import {
  onlyAlphabetsValidation,
  onlyEmailValidation,
  onlyPhoneNumberValidation,
} from "../../../utils/validation.js";
import notificationModel from "../../../models/adminModels/notification.model.js";
import taskModel from "../../../models/adminModels/task.model.js";
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: "ap-south-1",
});

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function generateSixDigitNumber() {
  const min = 100000;
  const max = 999999;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

// Function to check if the project is older than 6 months
function isProjectOlderThan6Months(createdDate) {
  // Get the current date
  const currentDate = new Date();

  // Calculate the difference in months
  const diffMonths =
    (currentDate.getFullYear() - createdDate.getFullYear()) * 12 +
    (currentDate.getMonth() - createdDate.getMonth());

  // Check if the difference is greater than or equal to 6 months
  return diffMonths >= 6;
}

// Example usage

export const getAllProject = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      responseData(res, "", 400, false, "user id is required");
    } else {
      const check_role = await registerModel.find({ _id: id });
      if (check_role.length > 0) {

        let execution = [];
        let design = [];
        let completed = [];
        let archive = [];
        let projects = [];
        const project = await projectModel.find({}).sort({ createdAt: -1 });

        for (let i = 0; i < project.length; i++) {
          if (project[i].project_status == "executing") {
            execution.push(project[i]);
          }
          if (project[i].project_status == "designing") {
            design.push(project[i]);
          }
          if (project[i].project_status == "completed") {
            completed.push(project[i]);
            const createdDate = project[i].project_end_date;
            const isOlderThan6Months = isProjectOlderThan6Months(createdDate);
            if (isOlderThan6Months) {
              archive.push(isOlderThan6Months);
            }
          }

          projects.push({
            project_id: project[i].project_id,
            project_name: project[i].project_name,
            project_status: project[i].project_status,
            project_start_date: project[i].project_start_date,
            project_end_date: project[i].project_end_date,
            project_description: project[i].project_description,
            project_image: project[i].project_image,
            project_budget: project[i].project_budget,
            client_name: project[i].client[0].client_name,
            project_type: project[i].project_type,
            designer: project[i].designer,
            client: project[i].client

          });
        }

        const response = {
          total_Project: projects.length,
          Execution_Phase: execution.length,
          Design_Phase: design.length,
          completed: completed.length,
          archive: archive.length,
          active_Project: projects.length - completed.length,
          projects,
        };
        responseData(
          res,
          "projects fetched successfully",
          200,
          true,
          "",
          response
        );

      }
      if (check_role.length < 1) {
        responseData(res, "", 404, false, " User not found.", []);
      }
    }
  } catch (error) {
    responseData(res, "", 500, false, "error in fetching projects");
  }
};

export const getSingleProject = async (req, res) => {
  const project_ID = req.query.project_id;
  const id = req.query.id;

  if (!project_ID) {
    responseData(res, "", 404, false, " Project ID is required.", []);
  } else if (!id) {
    responseData(res, "", 404, false, " User ID is required.", []);
  } else {
    try {
      const check_role = await registerModel.find({ _id: id });
      if (check_role.length < 1) {
        responseData(res, "", 404, false, " User not found.", []);
      }
      if (check_role.length > 0) {

        const find_project = await projectModel.find({
          project_id: project_ID,
        });
        if (find_project.length > 0) {
          let response = []
          const check_task = await taskModel.find({ project_id: project_ID })
          if (check_task.length < 1) {
            response.push({
              project_id: project_ID,
              project_name: find_project[0].project_name,
              project_type: find_project[0].project_type,
              project_status: find_project[0].project_status,
              timeline_date: find_project[0].timeline_date,
              project_budget: find_project[0].project_budget,
              description: find_project[0].description,
              designer: find_project[0].designer,
              task: [],
              client: find_project[0].client,
              lead_id: find_project[0].lead_id,
              mom: find_project[0].mom,
              quotation: find_project[0].quotation,
              visualizer: find_project[0].visualizer,
              leadmanager: find_project[0].leadmanager,
              project_start_date: find_project[0].project_start_date,
              project_end_date: find_project[0].project_end_date,
              project_location: find_project[0].project_location,
              project_updated_by: find_project[0].project_updated_by,
              percentage:0
            })
          }
          if (check_task.length > 0) {
            let count =0;
            let total_task_length = check_task.length;
            let percentage;

            for (let i = 0; i < check_task.length; i++) {
              if(check_task[i].task_status === 'Completed')
                {
                  count = count + 1;

                }
                if(check_task.task_status ==='Cancelled')
                  {
                    total_task_length--;
                  }
            }
            percentage = (count / total_task_length)*100;
           
            response.push({
              project_id: project_ID,
              project_name: find_project[0].project_name,
              project_type: find_project[0].project_type,
              project_status: find_project[0].project_status,
              timeline_date: find_project[0].timeline_date,
              project_budget: find_project[0].project_budget,
              description: find_project[0].description,
              designer: find_project[0].designer,
              task: check_task,
              client: find_project[0].client,
              lead_id: find_project[0].lead_id,
              mom: find_project[0].mom,
              quotation: find_project[0].quotation,
              visualizer: find_project[0].visualizer,
              leadmanager: find_project[0].leadmanager,
              project_start_date: find_project[0].project_start_date,
              project_end_date: find_project[0].project_end_date,
              project_location: find_project[0].project_location,
              project_updated_by: find_project[0].project_updated_by,
              percentage:percentage
            })

            }
         

          responseData(res, "project found", 200, true, "", response);
        }
        if (find_project < 1) {
          responseData(res, "", 404, false, "project not found", []);
        }

      }
    } catch (err) {
      responseData(res, "", 500, false, "error in fetching projects", err);
      console.log(err);
    }
  }
};

export const updateProjectDetails = async (req, res) => {
  const project_ID = req.body.project_id;
  const project_status = req.body.project_status;
  const timeline_date = req.body.timeline_date;
  const project_budget = req.body.project_budget;
  const description = req.body.description;
  const designer = req.body.designer;
  const user_id = req.body.user_id;

  if (!project_ID) {
    responseData(res, "", 400, false, " Project ID is required.", []);
  } else if (!timeline_date) {
    responseData(res, "", 400, false, " timeline_date is required.", []);
  } else if (!project_budget) {
    responseData(res, "", 400, false, " project_budget is required.", []);
  } else if (!project_status) {
    responseData(res, "", 400, false, "project status required.", []);
  }
  else if (!designer && onlyAlphabetsValidation(designer)) {
    responseData(res, "", 400, false, "designer name is required.", []);
  }
  else if (!user_id) {
    responseData(res, "", 400, false, "user id is required.", []);
  }

  //  *********** add other validation **********//
  else {
    try {
      const find_user = await registerModel.find
        ({ _id: user_id })
      if (!find_user) {
        responseData(res, "", 400, false, "user not found.", []);

      }
      const project_find = await projectModel.find({ project_id: project_ID });
      if (project_find.length > 0) {
        const project_update = await projectModel.findOneAndUpdate(
          { project_id: project_ID },
          {
            $set: {
              project_budget: project_budget,
              project_status: project_status,
              timeline_date: timeline_date,
              project_end_date: timeline_date,
              description: description,
              designer: designer
            },

            $push: {
              project_updated_by: {
                username: find_user[0].username,
                role:find_user[0].role,
                project_budget: project_budget,
                project_status: project_status,
                timeline_date: timeline_date,
                description: description,
                designer: designer,
                message: `has updated project ${project_find[0].project_name}.`,
                updated_date: new Date()

              }

            },

          },

          { new: true, useFindAndModify: false }
        );
        const newNotification = new notificationModel({
          type: "project",
          notification_id: generateSixDigitNumber(),
          itemId: project_ID,
          message: `project  updated: Project name ${project_find[0].project_name}up date on ${formatDate(new Date())}.`,
          status: false,
        });
        await newNotification.save();


        responseData(
          res,
          "Project Data Updated",
          200,
          true,
          "",
        );
      }
      if (project_find.length < 1) {
        responseData(res, "", 404, false, "Project Data Not Found", []);
      }
    } catch (err) {
      res.send(err);
      console.log(err);
    }
  }
};


