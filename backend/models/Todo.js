const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },

    completed: {
      type: Boolean,
      default: false
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    dueDate: {
      type: String
    },

    // ✅ STEP 1 GOES HERE (INSIDE SCHEMA)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
