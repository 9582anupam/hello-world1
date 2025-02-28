import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";

// Schema for individual question answers
const QuestionAnswerSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    userAnswer: {
        type: mongoose.Schema.Types.Mixed, // Can be String, Array, or Object depending on question type
        required: true
    },
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
}, { _id: false });

// Main assessment result schema
const assessmentResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    maxScore: {
        type: Number,
        required: true
    },
    token: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    timeTaken: {
        type: Number, // Total time in seconds
        default: 0
    },
    answers: {
        type: [QuestionAnswerSchema],
        required: true
    },

}, { timestamps: true });

// Virtual for correct answer count
assessmentResultSchema.virtual('correctAnswers').get(function () {
    return this.answers.filter(answer => answer.isCorrect).length;
});

// Virtual for incorrect answer count
assessmentResultSchema.virtual('incorrectAnswers').get(function () {
    return this.answers.filter(answer => !answer.isCorrect).length;
});

// Virtual for completion time in minutes
assessmentResultSchema.virtual('completionTimeMinutes').get(function () {
    return Math.round(this.timeTaken / 60 * 10) / 10; // Round to 1 decimal place
});

// Virtual for pass/fail status based on configurable threshold (default 60%)
assessmentResultSchema.virtual('passed').get(function () {
    const threshold = 60; // can be made configurable
    return this.percentage >= threshold;
});

// Add method to calculate statistics
assessmentResultSchema.methods.calculateStats = function () {
    return {
        totalQuestions: this.answers.length,
        correctAnswers: this.answers.filter(answer => answer.isCorrect).length,
        incorrectAnswers: this.answers.filter(answer => !answer.isCorrect).length,
        score: this.score,
        maxScore: this.maxScore,
        percentage: this.percentage,
        timeTaken: this.timeTaken,
        passed: this.passed,
        status: this.status
    };
};

// Static method to find all results for a specific user
assessmentResultSchema.statics.findByUser = function (userId) {
    return this.find({ user: userId }).sort({ completedAt: -1 });
};

// Static method to find all results for a specific assessment
assessmentResultSchema.statics.findByAssessment = function (assessmentId) {
    return this.find({ assessment: assessmentId }).sort({ completedAt: -1 });
};

// Static method to calculate average score for an assessment
assessmentResultSchema.statics.getAssessmentStats = async function (assessmentId) {
    const results = await this.aggregate([
        { $match: { assessment: new mongoose.Types.ObjectId(assessmentId), status: "completed" } },
        {
            $group: {
                _id: "$assessment",
                avgScore: { $avg: "$percentage" },
                highestScore: { $max: "$percentage" },
                lowestScore: { $min: "$percentage" },
                totalAttempts: { $sum: 1 },
                avgTimeTaken: { $avg: "$timeTaken" }
            }
        }
    ]);

    return results[0] || {
        _id: assessmentId,
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalAttempts: 0,
        avgTimeTaken: 0
    };
};

// Add pagination support
// assessmentResultSchema.plugin(mongoosePaginate);

// Add indexes for common queries
assessmentResultSchema.index({ user: 1, completedAt: -1 });
assessmentResultSchema.index({ assessment: 1, completedAt: -1 });
assessmentResultSchema.index({ percentage: -1 });

const AssessmentResult = mongoose.model("AssessmentResult", assessmentResultSchema);

export default AssessmentResult;
