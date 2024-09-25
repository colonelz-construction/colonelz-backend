import projectModel from "../../../models/adminModels/project.model.js";
import { responseData } from "../../../utils/respounse.js";

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
function generateSixDigitNumber() {
  const min = 100000;
  const max = 999999;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}


function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
      return responseData(res, "", 400, false, "User ID is required");
    }

    const user = await registerModel.findById(id);
    if (!user) {
      return responseData(res, "", 404, false, "User not found");
    }

    // Fetch projects with only required fields and use lean for better performance
    const projects = await projectModel.find({})
      .select('project_id project_name project_status project_start_date project_end_date project_type designer client')
      .sort({ createdAt: -1 })
      .lean();

    // Initialize counters and categories
    let projectData = [];
    let execution = 0, design = 0, designAndExecution = 0, completed = 0, commercial = 0, residential = 0, archive = 0;

    for (const project of projects) {
      const {
        project_id,
        project_name,
        project_status,
        project_start_date,
        project_end_date,
        project_type,
        designer,
        client,
      } = project;

      // Add to projectData
      projectData.push({
        project_id,
        project_name,
        project_status,
        project_start_date,
        project_end_date,
        client_name: client[0]?.client_name || "",
        project_type,
        designer,
        client,
      });

      // Count based on project status and type
      if (project_status === "executing") execution++;
      else if (project_status === "designing") design++;
      else if (project_status === "design & execution") designAndExecution++;
      else if (project_status === "completed") completed++;
      if (project_type === "commercial") commercial++;
      else if (project_type === "residential") residential++;
    }

    // Calculate archives
    archive = projectData.filter(p => isProjectOlderThan6Months(p.project_end_date)).length;

    const totalProjects = projectData.length;
    const activeProjects = totalProjects - completed;

    const response = {
      total_Project: totalProjects,
      Execution_Phase: execution,
      Design_Phase: design,
      Design_Execution: designAndExecution,
      completed,
      commercial: ((commercial / totalProjects) * 100).toFixed(2),
      residential: ((residential / totalProjects) * 100).toFixed(2),
      archive,
      active_Project: activeProjects,
      projects: projectData,
    };

    responseData(res, "Projects fetched successfully", 200, true, "", response);
  } catch (error) {
    console.error(error.message); // Log the error for debugging
    responseData(res, "", 500, false, "Error in fetching projects");
  }
};



export const getSingleProject = async (req, res) => {
  const { project_id, id } = req.query;

  if (!project_id) {
    return responseData(res, "", 400, false, "Project ID is required.", []);
  }

  if (!id) {
    return responseData(res, "", 400, false, "User ID is required.", []);
  }

  try {
    // Fetch the user and project in parallel
    const [user, project] = await Promise.all([
      registerModel.findById(id),
      projectModel.findOne({ project_id }).lean(),
    ]);

    if (!user) {
      return responseData(res, "", 404, false, "User not found.", []);
    }

    if (!project) {
      return responseData(res, "", 404, false, "Project not found.", []);
    }

    // Fetch tasks associated with the project
    const tasks = await taskModel.find({ project_id }).lean();

    // Calculate task completion percentage
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.task_status === 'Completed').length;
    const cancelledTasks = tasks.filter(task => task.task_status === 'Cancelled').length;
    const percentage = totalTasks > 0 ? (completedTasks / (totalTasks - cancelledTasks)) * 100 : 0;

    // Construct response
    const response = {
      project_id: project.project_id,
      project_name: project.project_name,
      project_type: project.project_type,
      project_status: project.project_status,
      timeline_date: project.timeline_date,
      project_budget: project.project_budget,
      description: project.description,
      designer: project.designer,
      client: project.client,
      lead_id: project.lead_id,
      visualizer: project.visualizer,
      leadmanager: project.leadmanager,
      project_start_date: project.project_start_date,
      project_end_date: project.project_end_date,
      project_location: project.project_location,
      project_updated_by: project.project_updated_by,
      percentage: percentage
    };

    responseData(res, "Project found", 200, true, "", [response]);
  } catch (err) {
    console.error(err); // Log the error for debugging
    responseData(res, "", 500, false, "Error fetching project", err);
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
  const client_email = req.body.client_email;

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
  else if (!onlyEmailValidation(client_email) && client_email.length > 5) {
    responseData(res, "", 400, false, "client email is invalid", []);
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
          { project_id: project_ID, 'client.client_email': project_find[0].client[0].client_email },
          {
            $set: {
              project_budget: project_budget,
              project_status: project_status,
              timeline_date: timeline_date,
              project_end_date: timeline_date,
              description: description,
              designer: designer,
              'client.$.client_email': client_email
            },

            $push: {
              project_updated_by: {
                username: find_user[0].username,
                role: find_user[0].role,
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


