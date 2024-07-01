import mongoose from "mongoose";


const SubtaskSchema = new mongoose.Schema({
    sub_task_id: { type: String, required: true },
    sub_task_name: { type: String, required: true },
    sub_task_assignee: { type: String, required: true },
    sub_task_status: { type: String, required: true },
    sub_task_start_date: { type: String, required: true },
    sub_task_end_date: { type: String, required: true },
    sub_task_priority: { type: String, required: true },
    sub_task_description: { type: String, required: true },
    sub_task_createdBy: { type: String, required: true },
    sub_task_createdOn: { type: Date },
    sub_task_reporter: { type: String, required: true },
    sub_task_updatedBy: []
});

const TaskSchema = new mongoose.Schema({
    project_id: { type: String, required: true },
    task_id: { type: String, required: true },
    task_name: { type: String, required: true },
    task_assignee: { type: String, required: true },
    task_status: { type: String, required: true },
    task_start_date: { type: String, required: true },
    task_end_date: { type: String, required: true },
    task_description: { type: String, required: true },
    task_priority: { type: String, required: true },
    task_createdBy: { type: String, required: true },
    task_createdOn: { type: Date, required: true },
    reporter: { type: String, required: true },
    task_updatedBy: [],
    subtasks: [SubtaskSchema]

});

export default mongoose.model("task", TaskSchema, "task");
