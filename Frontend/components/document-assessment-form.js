import { useState } from 'react';

export default function DocumentAssessmentForm() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    numberOfQuestions: 5,
    difficulty: 'medium',
    type: 'MCQ'
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF or PowerPoint file.');
      setFile(null);
      return;
    }
    
    // Validate file size (max 25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File is too large. Maximum size is 25MB.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResult(null);
    
    const data = new FormData();
    data.append('document', file);
    data.append('numberOfQuestions', formData.numberOfQuestions);
    data.append('difficulty', formData.difficulty);
    data.append('type', formData.type);
    
    try {
      const response = await fetch('/api/v1/assessment/document', {
        method: 'POST',
        body: data
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate assessment');
      }
      
      setResult(result);
    } catch (err) {
      setError(err.message || 'An error occurred while generating the assessment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="document-assessment-form">
      <h2>Generate Assessment from Document</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="document">Upload PDF or PowerPoint</label>
          <input 
            type="file" 
            id="document" 
            accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
            onChange={handleFileChange} 
          />
          {file && <p className="file-info">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="numberOfQuestions">Number of Questions</label>
          <input 
            type="number" 
            id="numberOfQuestions" 
            name="numberOfQuestions" 
            min="1" 
            max="20" 
            value={formData.numberOfQuestions} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="difficulty">Difficulty Level</label>
          <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Question Type</label>
          <select id="type" name="type" value={formData.type} onChange={handleInputChange}>
            <option value="MCQ">Multiple Choice</option>
            <option value="TF">True/False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="FILL_IN_BLANK">Fill in the Blank</option>
          </select>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={isLoading || !file}>
          {isLoading ? 'Generating...' : 'Generate Assessment'}
        </button>
      </form>
      
      {isLoading && <div className="loading">Processing document and generating questions...</div>}
      
      {result && (
        <div className="result">
          <h3>Assessment Generated</h3>
          <p>Document: {result.fileName}</p>
          <p>Type: {result.documentType}</p>
          {result.metadata.pageCount && <p>Pages: {result.metadata.pageCount}</p>}
          {result.metadata.slideCount && <p>Slides: {result.metadata.slideCount}</p>}
          
          <h4>Questions:</h4>
          <div className="questions">
            {Array.isArray(result.assessment) ? (
              result.assessment.map((q, i) => (
                <div key={i} className="question">
                  <p><strong>Q{i+1}:</strong> {q.question}</p>
                  {q.options && (
                    <ul>
                      {q.options.map((opt, j) => (
                        <li key={j} className={opt === q.correctAnswer ? 'correct' : ''}>
                          {opt} {opt === q.correctAnswer ? '✓' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.explanation && <p><em>Explanation:</em> {q.explanation}</p>}
                </div>
              ))
            ) : (
              <pre>{JSON.stringify(result.assessment, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
