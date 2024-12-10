import { responseData } from "../../../utils/respounse.js";
import projectModel from "../../../models/adminModels/project.model.js";
import taskModel from "../../../models/adminModels/task.model.js";
import leadTaskModel from "../../../models/adminModels/leadTask.model.js";
import leadModel from "../../../models/adminModels/leadModel.js";
import { filterTasks } from "../../../utils/filterTasks.js"; 
import openTaskModel from "../../../models/adminModels/openTask.model.js";
import openTimerModel from "../../../models/adminModels/openTimer.model.js";
import { onlyAlphabetsValidation } from "../../../utils/validation.js";
import orgModel from "../../../models/orgmodels/org.model.js";
import registerModel from "../../../models/usersModels/register.model.js";

function generateSixDigitNumber() {
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomNumber;
}

const createTaskAndTimer = async (res,org_id, check_user, task_assignee, task_name, task_description, actual_task_start_date, estimated_task_start_date, estimated_task_end_date, task_status, task_priority, reporter) => {
    const task_id = `TK-${generateSixDigitNumber()}`;

    const task = new openTaskModel({
        task_id,
        org_id,
        task_name,
        task_description,
        actual_task_start_date,
        actual_task_end_date: "",
        estimated_task_start_date,
        estimated_task_end_date,
        task_status,
        task_priority,
        task_assignee,
        task_createdBy: check_user.username,
        task_createdOn: new Date(),
        reporter,
        subtasks: []
    });

    const taskTime = new openTimerModel({
        task_id,
        org_id,
        task_name,
        task_assignee,
        task_time: '',
        subtaskstime: []
    });

    await task.save();
    await taskTime.save();

    responseData(res, "Task created successfully", 200, true, "", []);
};

export const Alltask = async (req, res) => {
    try {
        const { org_id, task_assignee, task_status, task_priority } = req.query;

        if (!org_id) {
            return responseData(res, "", 400, false, "org_id is required", []);
        }
        const [projectTasks, leadTasks, openTasks] = await Promise.all([
            taskModel.find({ org_id }),    
            leadTaskModel.find({ org_id }),
            openTaskModel.find({ org_id }) 
        ]);
        const [projects, leads] = await Promise.all([
            projectModel.find({ org_id, project_id: { $in: projectTasks.map(task => task.project_id) } }),
            leadModel.find({ org_id, lead_id: { $in: leadTasks.map(task => task.lead_id) } }),
        ]);
        const projectTaskDetails = projectTasks.map(task => {
            const project = projects.find(p => p.project_id === task.project_id);
            return {
                project_id: task.project_id,
                name: project ? project.project_name : "Unknown",
                type: "project type",
                task_id: task.task_id,
                org_id: task.org_id,
                task_name: task.task_name,
                task_status: task.task_status,
                task_priority: task.task_priority,
                task_assignee: task.task_assignee,
                task_start_date: task.estimated_task_start_date,
                task_end_date: task.estimated_task_end_date
            };
        });
        const leadTaskDetails = leadTasks.map(task => {
            const lead = leads.find(l => l.lead_id === task.lead_id);
            return {
                lead_id: task.lead_id,
                name: lead ? lead.name : "Unknown",
                type: "lead type",
                task_id: task.task_id,
                org_id: task.org_id,
                task_name: task.task_name,
                task_status: task.task_status,
                task_priority: task.task_priority,
                task_assignee: task.task_assignee,
                task_start_date: task.estimated_task_start_date,
                task_end_date: task.estimated_task_end_date
            };
        });

        const openTaskDetails = openTasks.map(task => {
            return {
                name: "Unknown",
                type: "open type",
                task_id: task.task_id,
                org_id: task.org_id,
                task_name: task.task_name,
                task_status: task.task_status,
                task_priority: task.task_priority,
                task_assignee: task.task_assignee,
                task_start_date: task.estimated_task_start_date,
                task_end_date: task.estimated_task_end_date
            };
        });

        
        const allTasks = [...projectTaskDetails, ...leadTaskDetails, ...openTaskDetails];
        const filterConditions = {};
        if (task_assignee) filterConditions.task_assignee = task_assignee;
        if (task_status) filterConditions.task_status = task_status;
        if (task_priority) filterConditions.task_priority = task_priority;
        const filteredTasks = filterTasks(allTasks, filterConditions);
        return responseData(res, "All tasks fetched successfully", 200, true, "", filteredTasks);

    } catch (error) {
        console.log(error);
        return responseData(res, "", 500, false, "Internal server error", []);
    }
};

export const createOpenTask = async (req, res) => {

    try {
        const user_id = req.body.user_id;
        const org_id = req.body.org_id;
        const task_name = req.body.task_name;
        const task_description = req.body.task_description;
        const actual_task_start_date = req.body.actual_task_start_date;
        const estimated_task_start_date = req.body.estimated_task_start_date;
        const estimated_task_end_date = req.body.estimated_task_end_date;
        const task_status = req.body.task_status;
        const task_priority = req.body.task_priority;
        const task_assignee = req.body.task_assignee;
        const reporter = req.body.reporter;

        if (!user_id) return responseData(res, "", 404, false, "User Id required", []);
        if (!onlyAlphabetsValidation(task_name) || task_name.length < 3) {
            return responseData(res, "", 404, false, "Task Name should be alphabets and at least 3 characters long", []);
        }
        if (!task_priority) return responseData(res, "", 404, false, "Task priority required", []);
        if (!estimated_task_start_date) return responseData(res, "", 404, false, "Task start date required", []);
        if (!estimated_task_end_date) return responseData(res, "", 404, false, "Task end date required", []);
        if (!task_status) return responseData(res, "", 404, false, "Task status required", []);
        if (!org_id) return responseData(res, "", 400, false, "Org Id required");
        // Check if the user exists
        const check_org = await orgModel.findOne({ _id: org_id })
        if (!check_org) {
            return responseData(res, "", 404, false, "Org not found");
        }
        const check_user = await registerModel.findOne({ _id: user_id,organization: org_id });
        if (!check_user) return responseData(res, "", 404, false, "User not found", []);

        await createTaskAndTimer(res,  org_id, check_user, task_assignee, task_name, task_description, actual_task_start_date, estimated_task_start_date, estimated_task_end_date, task_status, task_priority, reporter);      

    } catch (err) {
        console.log(err);
        res.status(500).send({ error: 'Internal Server Error', details: err });
    }

}

export const getSingleOpenTask = async (req, res) => {
    try {
        const { user_id, task_id, org_id } = req.query;

        // Validate required parameters
        if (!user_id || !task_id || !org_id) {
            return responseData(res, "", 400, false, "User ID, and Task ID, Org ID are required", []);
        }

        // Aggregate to find user, project, and task
        const result = await openTaskModel.aggregate([
            {
                $match: {
                    task_id: task_id,
                    org_id: org_id
                },
            },
            {
                $lookup: {
                    from: "users", // Assuming the collection name for users
                    localField: "task_assignee",
                    foreignField: "_id",
                    as: "assignee_info",
                },
            },
            {
                $project: {
                    project_id: 1,
                    task_id: 1,
                    task_name: 1,
                    task_description: 1,
                    actual_task_start_date: 1,
                    actual_task_end_date: 1,
                    estimated_task_end_date: 1,
                    estimated_task_start_date: 1,
                    task_status: 1,
                    task_priority: 1,
                    task_createdOn: 1,
                    reporter: 1,
                    task_assignee: 1,
                    task_createdBy: 1,
                    number_of_subtasks: { $size: "$subtasks" },
                    assignee_name: { $arrayElemAt: ["$assignee_info.name", 0] }, // Adjust based on your user schema
                },
            },
        ]);

        if (!result.length) {
            return responseData(res, "Task not found", 200, false, "", []);
        }

        responseData(res, "Task found successfully", 200, true, "", result);
    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal server error", []);
    }
};

export const updateOpenTask = async (req, res) => {

    try {
        const user_id = req.body.user_id;
        const org_id = req.body.org_id;
        const task_name = req.body.task_name;
        const task_description = req.body.task_description;
        const actual_task_start_date = req.body.actual_task_start_date;
        const estimated_task_start_date = req.body.estimated_task_start_date;
        const estimated_task_end_date = req.body.estimated_task_end_date;
        const actual_task_end_date = req.body.actual_task_end_date;
        const task_status = req.body.task_status;
        const task_priority = req.body.task_priority;
        const task_assignee = req.body.task_assignee;
        const reporter = req.body.reporter;
        const task_id = req.body.task_id;
        if (!user_id) {
            responseData(res, "", 404, false, "User Id required", [])
        }
        else if (!onlyAlphabetsValidation(task_name) && task_name.length > 3) {
            responseData(res, "", 404, false, "Task Name should be alphabets", [])
        }
        else if (!task_id) {
            responseData(res, "", 404, false, "Task Id required", [])
        }
        else if (!task_priority) {
            responseData(res, "", 404, false, "task priority required", [])

        }
        else if (!estimated_task_start_date) {
            responseData(res, "", 404, false, "Task start date  required", [])
        }
        else if (!estimated_task_end_date) {
            responseData(res, "", 404, false, "Task end date required", [])
        }
        else if (!task_status) {
            responseData(res, "", 404, false, "Task status required", [])
        }
        else if (!task_assignee) {
            responseData(res, "", 404, false, "Task assignee required", [])
        }
        else if (!reporter) {
            responseData(res, "", 404, false, "Task reporter required", [])
        }
        else if (!org_id) {
            return responseData(res, "", 400, false, "Organization Id is required");
        }
        else {
            const check_org = await orgModel.findOne({ _id: org_id })
            if (!check_org) {
                return responseData(res, "", 404, false, "Org not found");
            }
            const check_user = await registerModel.findOne({ _id: user_id, organization: org_id })
            if (!check_user) {
                responseData(res, "", 404, false, "User not found", [])
            }
            else {
                
                const check_task = await openTaskModel.findOne({ task_id: task_id, org_id: org_id })
                if (!check_task) {
                    responseData(res, "", 404, false, "Task not found", [])
                }
                else {
                    const update_task = await openTaskModel.findOneAndUpdate({ task_id: task_id, org_id: org_id },
                        {
                            $set: {
                                task_name: task_name,
                                task_description: task_description,
                                actual_task_start_date: actual_task_start_date,
                                actual_task_end_date: actual_task_end_date,
                                estimated_task_end_date: estimated_task_end_date,
                                estimated_task_start_date: estimated_task_start_date,
                                task_status: task_status,
                                task_priority: task_priority,
                                task_assignee: task_assignee,
                                reporter: reporter,
                            },
                            $push: {
                                task_updatedBy: {
                                    task_updatedBy: check_user.username,
                                    role: check_user.role,
                                    task_updatedOn: new Date()
                                }

                            }
                        },
                        { new: true, useFindAndModify: false }
                    )
                    if (update_task) {
                        responseData(res, "Task updated successfully", 200, true, "", [])
                    }
                    else {
                        responseData(res, "", 404, false, "Task not updated", [])
                    }
                }
                
            }
        }
    }
    catch (err) {
        console.log(err);
        res.send(err);
    }
}

export const deleteOpenTask = async (req, res) => {
    try {
        const user_id = req.body.user_id;
        const task_id = req.body.task_id;
        const org_id = req.body.org_id;

        if (!user_id) {
            responseData(res, "", 404, false, "User Id required", [])
        }
       

        else if (!task_id) {
            responseData(res, "", 404, false, "Task Id required", [])
        }
        else if (!org_id) {
            return responseData(res, "", 400, false, "Organization Id is required");
        }
        else {
            const check_org = await orgModel.findOne({ _id: org_id })
            if (!check_org) {
                return responseData(res, "", 404, false, "Org not found");
            }
            const check_user = await registerModel.findOne({ _id: user_id, organization: org_id });
            if (!check_user) {
                responseData(res, "", 404, false, "User not found", [])
            }
            else {
                const check_task = await openTaskModel.findOne({ task_id: task_id, org_id: org_id });
                if (!check_task) {
                    responseData(res, "", 404, false, "Task not found", [])
                }
                else {
                    const delete_task = await openTaskModel.findOneAndDelete({ task_id: task_id, org_id: org_id })
                    if (delete_task) {
                        responseData(res, "Task deleted successfully", 200, true, "", [])
                    }
                    else {
                        responseData(res, "", 404, false, "Task not deleted", [])
                    }
                }
                

            }
        }


    }
    catch (err) {
        console.log(err);
        res.send(err);

    }
}

