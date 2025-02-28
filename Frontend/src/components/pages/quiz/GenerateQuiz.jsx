import { useState, useRef } from "react"
import { FileText, Youtube, Video, Music, FileUp, BrainCircuit, ChevronDown, Upload, AlertCircle } from "lucide-react"

const GenerateQuiz = () => {
    const [selectedInput, setSelectedInput] = useState(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false)
    const [isQuestionCountDropdownOpen, setIsQuestionCountDropdownOpen] = useState(false)
    const [file, setFile] = useState(null)
    const [inputValue, setInputValue] = useState("")
    const [error, setError] = useState("")
    const [difficulty, setDifficulty] = useState(null)
    const [questionCount, setQuestionCount] = useState(null)
    const fileInputRef = useRef(null)

    const inputTypes = [
        {
        id: "youtube",
        name: "YouTube URL",
        description: "Generate questions from YouTube video URL",
        icon: <Youtube className="h-5 w-5" />,
        placeholder: "Paste YouTube URL here...",
        acceptsFile: false,
        },
        {
        id: "mp4-local",
        name: "MP4 Video",
        description: "Generate questions from videos uploaded from local",
        icon: <Video className="h-5 w-5" />,
        placeholder: "Upload MP4 video file",
        acceptsFile: true,
        fileType: "video/mp4",
        },
        {
        id: "mp4-url",
        name: "MP4 URL",
        description: "Generate questions from MP4 URL uploaded online",
        icon: <Video className="h-5 w-5" />,
        placeholder: "Paste MP4 video URL here...",
        acceptsFile: false,
        },
        {
        id: "mp3-local",
        name: "MP3 Audio",
        description: "Generate questions from MP3 audio uploaded from local",
        icon: <Music className="h-5 w-5" />,
        placeholder: "Upload MP3 audio file",
        acceptsFile: true,
        fileType: "audio/mpeg",
        },
        {
        id: "mp3-url",
        name: "MP3 URL",
        description: "Generate questions from MP3 URL uploaded online",
        icon: <Music className="h-5 w-5" />,
        placeholder: "Paste MP3 audio URL here...",
        acceptsFile: false,
        },
        {
        id: "document",
        name: "PDF/PPT/TXT",
        description: "Extract and analyze text content from local upload",
        icon: <FileText className="h-5 w-5" />,
        placeholder: "Upload document file",
        acceptsFile: true,
        fileType: ".pdf,.ppt,.pptx,.txt",
        },
        {
        id: "topic",
        name: "Specific Topic",
        description: "Use AI to generate content and questions based on the topic",
        icon: <BrainCircuit className="h-5 w-5" />,
        placeholder: "Enter your topic here...",
        acceptsFile: false,
        },
    ]

    const difficultyLevels = [
        { id: "easy", name: "Easy" },
        { id: "medium", name: "Medium "},
        { id: "hard", name: "Hard" }
    ]

    const questionCounts = [
        { id: "5", name: "5 Questions" },
        { id: "10", name: "10 Questions" }
    ]

    const handleInputTypeSelect = (inputType) => {
        setSelectedInput(inputType)
        setIsDropdownOpen(false)
        setError("")
        setFile(null)
        setInputValue("")
    }

    const handleDifficultySelect = (difficultyLevel) => {
        setDifficulty(difficultyLevel)
        setIsDifficultyDropdownOpen(false)
    }

    const handleQuestionCountSelect = (count) => {
        setQuestionCount(count)
        setIsQuestionCountDropdownOpen(false)
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]

        if (selectedFile) {
        // Check file size (15MB limit)
        if (selectedFile.size > 15 * 1024 * 1024) {
            setError("File size exceeds 15MB limit")
            setFile(null)
            return
        }

        setFile(selectedFile)
        setError("")
        }
    }
    
    // useEffect(() => {
    //     const defaultInput = inputTypes.find(input => input.id === "youtube")
    //     setSelectedInput(defaultInput)
    // }, [])

    const handleInputChange = (e) => {
        setInputValue(e.target.value)
        setError("")
    }

    const handleSubmit = () => {
        if (selectedInput.acceptsFile && !file) {
            setError("Please upload a file")
            return
        }

        if (!selectedInput.acceptsFile && !inputValue) {
            setError("Please enter a valid input")
            return
        }

        if (!difficulty) {
            setError("Please select a difficulty level")
            return
        }

        if (!questionCount) {
            setError("Please select number of questions")
            return
        }

        // Process the input (file or text)
        console.log("Processing input:", selectedInput.id)
        console.log("File:", file)
        console.log("Input value:", inputValue)
        console.log("Difficulty:", difficulty.id)
        console.log("Question count:", questionCount.id)

        // Here you would typically send the data to your backend
        alert("Input submitted successfully!")
    }

    const triggerFileInput = () => {
        fileInputRef.current.click()
    }

    return (
        <section className="py-16 bg-slate-900 -mt-2 min-h-screen">
        <div className="container mx-auto px-6 -mt-12">
            <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Generate Your Quiz</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto mb-6"></div>
            </div>

            <div className="max-w-3xl mx-auto">
            <div className="bg-slate-950 rounded-xl p-8 border border-cyan-900/30 shadow-lg">
                {/* Input Type Selector */}
                <div className="mb-8">
                <label className="block text-slate-300 mb-2 font-medium">Select Input Type</label>
                <div className="relative">
                    <button
                    className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 text-left transition-all"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                    {selectedInput ? (
                        <div className="flex items-center">
                        <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-2 rounded-lg mr-3">
                            {selectedInput.icon}
                        </div>
                        <div>
                            <div className="font-medium text-slate-200">{selectedInput.name}</div>
                            <div className="text-sm text-slate-400">{selectedInput.description}</div>
                        </div>
                        </div>
                    ) : (
                        <span className="text-slate-400">Choose an input method...</span>
                    )}
                    <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                    </button>

                    {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                        {inputTypes.map((inputType) => (
                        <div
                            key={inputType.id}
                            className="flex items-center p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0"
                            onClick={() => handleInputTypeSelect(inputType)}
                        >
                            <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-2 rounded-lg mr-3">
                            {inputType.icon}
                            </div>
                            <div>
                            <div className="font-medium text-slate-200">{inputType.name}</div>
                            <div className="text-sm text-slate-400">{inputType.description}</div>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>

                {/* Input Area */}
                {selectedInput && (
                <div className="mb-6">
                    <label className="block text-slate-300 mb-2 font-medium">
                    {selectedInput.acceptsFile ? "Upload File" : "Enter Input"}
                    </label>

                    {selectedInput.acceptsFile ? (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-cyan-500/50 ${error ? "border-red-500" : "border-slate-700"}`}
                        onClick={triggerFileInput}
                    >
                        <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={selectedInput.fileType}
                        onChange={handleFileChange}
                        />

                        {file ? (
                        <div className="flex items-center justify-center">
                            <FileUp className="h-6 w-6 text-cyan-500 mr-2" />
                            <span className="text-slate-300">{file.name}</span>
                        </div>
                        ) : (
                        <div>
                            <Upload className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-400 mb-1">Drag and drop your file here or click to browse</p>
                            <p className="text-slate-500 text-sm">Maximum file size: 15MB</p>
                        </div>
                        )}
                    </div>
                    ) : (
                    <input
                        type="text"
                        className={`w-full bg-slate-900 border rounded-lg p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${error ? "border-red-500" : "border-slate-700"}`}
                        placeholder={selectedInput.placeholder}
                        value={inputValue}
                        onChange={handleInputChange}
                    />
                    )}

                    {error && (
                    <div className="flex items-center mt-2 text-red-500">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">{error}</span>
                    </div>
                    )}
                </div>
                )}

                {/* Quiz Configuration - only show if input is selected */}
                {selectedInput && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Difficulty Selector */}
                    <div>
                        <label className="block text-slate-300 mb-2 font-medium">Difficulty Level</label>
                        <div className="relative">
                            <button
                                className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 text-left transition-all"
                                onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                            >
                                {difficulty ? (
                                    <div>
                                        <div className="font-medium text-slate-200">{difficulty.name}</div>
                                    </div>
                                ) : (
                                    <span className="text-slate-400">Select difficulty...</span>
                                )}
                                <ChevronDown
                                    className={`h-5 w-5 text-slate-400 transition-transform ${isDifficultyDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isDifficultyDropdownOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                                    {difficultyLevels.map((level) => (
                                        <div
                                            key={level.id}
                                            className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0"
                                            onClick={() => handleDifficultySelect(level)}
                                        >
                                            <div className="font-medium text-slate-200">{level.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question Count Selector */}
                    <div>
                        <label className="block text-slate-300 mb-2 font-medium">Number of Questions</label>
                        <div className="relative">
                            <button
                                className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 text-left transition-all"
                                onClick={() => setIsQuestionCountDropdownOpen(!isQuestionCountDropdownOpen)}
                            >
                                {questionCount ? (
                                    <div>
                                        <div className="font-medium text-slate-200">{questionCount.name}</div>
                                    </div>
                                ) : (
                                    <span className="text-slate-400">Select question count...</span>
                                )}
                                <ChevronDown
                                    className={`h-5 w-5 text-slate-400 transition-transform ${isQuestionCountDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isQuestionCountDropdownOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                                    {questionCounts.map((count) => (
                                        <div
                                            key={count.id}
                                            className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0"
                                            onClick={() => handleQuestionCountSelect(count)}
                                        >
                                            <div className="font-medium text-slate-200">{count.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Submit Button */}
                {selectedInput && (
                <button
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                    onClick={handleSubmit}
                >
                    Generate Quiz
                </button>
                )}
            </div>
            </div>
        </div>
        </section>
    )
}

export default GenerateQuiz