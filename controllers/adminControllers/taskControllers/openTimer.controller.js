import { responseData } from "../../../utils/respounse.js";
import openTaskModel from "../../../models/adminModels/openTask.model.js";
import openTimerModel from "../../../models/adminModels/openTimer.model.js";

export const UpdateOpenSubtimerController = async (req, res) => {
    try {
        const time = req.body.time;
        const isrunning = req.body.isrunning;
        const totalTime = req.body.total_time;
        const current = req.body.current;
        const task_id = req.body.task_id;
        const sub_task_id = req.body.sub_task_id;
        const sub_task_assignee = req.body.sub_task_assignee;

        if (!time) {
            return responseData(res, "", 400, false, "Time is required")
        }
        else if (!task_id) {
            return responseData(res, "", 400, false, "Task id is required")
        }
        else if (!sub_task_id) {
            return responseData(res, "", 400, false, "Sub task id is required")
        }

        else if (!totalTime) {
            return responseData(res, "", 400, false, "Total time is required")
        }
        else if (!current) {
            return responseData(res, "", 400, false, "Current time is required")
        }

        else {
            const check_task = await openTaskModel.findOne({ task_id: task_id })
            if (!check_task) {
                return responseData(res, "", 400, false, "Task not found")
            }
            else {
                if (check_task.task_status === 'Compeleted' || check_task.task_status === 'Cancelled') {
                    return responseData(res, "", 400, false, "Task is already completed or cancelled")
                }
                else {
                    const check_subtask = check_task.subtasks.find((item) => item.sub_task_id === sub_task_id)
                    if (!check_subtask) {

                        return responseData(res, "", 400, false, "Sub task not found")

                    }
                    else {

                        if (check_subtask.sub_task_status === 'Completed' || check_subtask.sub_task_status === 'Cancelled') {
                            await openTimerModel.findOneAndUpdate({
                                task_id: task_id,
                                'subtaskstime.sub_task_id': sub_task_id
                            },
                                {
                                    $set: {
                                        'subtaskstime.$.sub_task_isrunning': false,

                                    }
                                },
                                { new: true, useFindAndModify: false }
                            )
                            return responseData(res, "", 400, false, "Sub task is already completed or cancelled")
                        }
                        else if (check_subtask.sub_task_assignee !== sub_task_assignee) {
                            return responseData(res, "", 400, false, "Sub task assignee is not valid")
                        }
                        else {
                            const update_timer = await openTimerModel.findOneAndUpdate({
                                task_id: task_id,
                                'subtaskstime.sub_task_id': sub_task_id
                            },
                                {
                                    $set: {
                                        'subtaskstime.$.sub_task_time': time,
                                        'subtaskstime.$.sub_task_isrunning': isrunning,

                                        'subtaskstime.$.sub_task_totalTime': totalTime,
                                        'subtaskstime.$.sub_task_current': current


                                    }
                                },
                                { new: true, useFindAndModify: false }
                            )

                            if (update_timer) {
                                return responseData(res, "Timer updated successfully", 200, true, "")
                            }
                            else {
                                return responseData(res, "", 400, false, "Timer not updated")
                            }
                        }
                    }
                }

            }
        }
    }
    catch (err) {
        console.log(err)
        responseData(res, "", 500, false, "Internal Server Error", err)
    }

}

export const GetSingleOpenSubtimerController = async (req, res) => {
    try {
        const { task_id, sub_task_id } = req.query;

        // Validate required fields in a single step
        if (!task_id || !sub_task_id) {
            const missingField = !task_id ? "Task id" : "Sub task id";
            return responseData(res, "", 400, false, `${missingField} is required`);
        }

        // Combine both checks into a single database query using aggregation for better performance
        const taskWithSubtask = await openTimerModel.aggregate([
            {
                $match: {
                    task_id,
                    'subtaskstime.sub_task_id': sub_task_id
                }
            },
            {
                $project: {
                    subtask: {
                        $filter: {
                            input: '$subtaskstime',
                            as: 'subtask',
                            cond: { $eq: ['$$subtask.sub_task_id', sub_task_id] }
                        }
                    }
                }
            }
        ]);

        // If task or subtask is not found, return an error
        if (!taskWithSubtask.length || !taskWithSubtask[0].subtask.length) {
            return responseData(res, "", 400, false, "Task or Sub task not found");
        }

        // Prepare the response data
        const subtask = taskWithSubtask[0].subtask[0];
        const response = {
            time: subtask.sub_task_time,
            isrunning: subtask.sub_task_isrunning,
            total_time: subtask.sub_task_totalTime,
            current: subtask.sub_task_current,
        };

        return responseData(res, "Sub task timer found", 200, true, "", response);
    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal Server Error", err);
    }
};