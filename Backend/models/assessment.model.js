import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";

// Schema for individual questions
const QuestionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        default: [],
    },
    correctAnswer: {
        type: String,
    },
    explanation: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
    }
}, { _id: false });

// // Schema for assessment metadata
// const MetadataSchema = new mongoose.Schema({
//     sourceType: {
//         type: String,
//         enum: ["youtube", "video", "audio", "document", "text", "pdf", "ppt"],
//         required: true
//     },
//     sourceDetails: {
//         videoId: String,
//         fileName: String,
//         fileSize: Number,
//         duration: Number,
//         pages: Number,
//         slides: Number,
//         url: String,
//         title: String
//     },
// }, { _id: false });

// Main assessment schema
const assessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ["MCQ", "TF", "SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK", "MATCHING"],
        default: "MCQ"
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    questions: {
        type: [QuestionSchema],
        validate: {
            validator: function (questions) {
                return questions.length > 0;
            },
            message: "Assessment must have at least one question"
        }
    },
    // metadata: {
    //     type: MetadataSchema,
    //     required: true
    // },
    tags: {
        type: [String],
        default: []
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    attemptedBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User"
    }
}, { timestamps: true });

// Virtual for question count
assessmentSchema.virtual('questionCount').get(function () {
    return this.questions.length;
});

// Add pagination support
// assessmentSchema.plugin(mongoosePaginate);

// Add text search index
assessmentSchema.index({
    title: 'text',
    description: 'text',
    'questions.question': 'text',
    tags: 'text'
});

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;
