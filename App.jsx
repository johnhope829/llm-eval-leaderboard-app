"use client"

import { useState, useEffect } from "react"
import "./App.css"
import { fetchAndProcessData } from "./utils/dataProcessor"

// Define the categories and their corresponding data sources (now in alphabetical order)
const categories = [
  {
    id: "accuracy-retrieval",
    name: "Accuracy of Retrieval",
    description: "Measures how well LLMs retrieve relevant information from their knowledge base",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Accuracy%20of%20Retrieval%29%20%283%29-vgjU8YSfnj2oSo6wpZdEpWzPZGd12O.csv",
    summary:
      "The baseline RAG model performs moderately on SQuAD with decent MRR but low Precision@K and F1, and struggles with FiQA, showing lower precision in domain-specific contexts but higher recall. Integrating MLFlow improves SQuAD performance significantly, achieving near-perfect metrics, but does not address FiQA's challenges. RAG with scikit-learn outperforms the baseline in both datasets, showing strong results on SQuAD and better performance on FiQA, indicating its suitability for domain-specific tasks. DeepEval's high Answer Relevancy scores suggest that the model generates contextually appropriate answers even when retrieval precision is low. Future improvements could include reranking strategies, fine-tuning on industry-specific datasets, and incorporating user feedback.",
  },
  {
    id: "bias-detection",
    name: "Bias Detection",
    description: "Evaluates how well frameworks detect and measure bias in LLM outputs",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Bias%20Detection%29-bx4jBTCbDDslED7actxLQhxvjI1FlK.csv",
    summary:
      "Our evaluation shows that Claude outperformed Stanford CoreNLP on gender bias detection in coreference resolution but exhibited a larger bias gap, indicating stronger stereotyping. In the CrowS-Pairs task, LLM-based methods outperformed traditional NLP, with DeepEval Custom achieving high detection sensitivity but at a high false positive rate. The Empath lexicon approach struggled with nuanced bias detection. Claude 3.5 Sonnet mostly challenged harmful prompts rather than refusing them. Future work should focus on explanatory prompting, dataset expansion, and model fine-tuning for bias detection. For organizations, Claude is effective for detecting subtle biases in HR, while financial and healthcare sectors may require tailored models to balance detection sensitivity and precision.",
  },
  {
    id: "hallucination",
    name: "Hallucination",
    description: "Assesses the tendency of LLMs to generate false or misleading information",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Hallucination%29%20%281%29-z5tcH6ZxzZ2T5QTsL3gNkx6WKtGLcl.csv",
    summary:
      "Arize AI Phoenix showed the best overall performance with high accuracy and F1 score, while G-Eval excelled in precision but had lower recall. Traditional NLP metrics METEOR, ROUGE and BLEU had perfect recall but the lowest accuracy. The fine-tuned BERTScore variants, BERT Base and RoBERTa, outperformed all LLM-as-a-judge methods in accuracy and runtime, but the results are taken with heavy caution and assumption of overfitting to in-scope datasets.",
  },
  {
    id: "readability",
    name: "Readability",
    description: "Measures how clear and understandable LLM outputs are",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Readability%29-mqvvs8FnJqL4qk1JNLNyHzi9uS0dnh.csv",
    summary:
      "Novel Readability outperforms Claude in terms of accuracy and error, offering a more robust and interpretable evaluation of LLM readability. While Lexical Difficulty performs well due to its correlation with human-written text, Novel Readability provides a better overall measure by assessing multiple features. Claude is faster, but both methods are based on the subjective CAREC score. The study recommends Novel Readability first, followed by LLM-as-a-Judge and CAREC.",
  },
  {
    id: "summarization",
    name: "Summarization",
    description: "Evaluates how well LLMs can condense and summarize longer texts",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Summarization%29%20%281%29-PANuNbPTzGWyIPX3lXmu95mlQHThGu.csv",
    summary:
      "Traditional metrics like BLEU showed better alignment with human evaluations than METEOR and BertScore F1, highlighting the importance of semantic similarity. LLM-based metrics, particularly DeepEval, had stronger correlations, focusing on factual consistency. Traditional metrics showed lower variance, while LLM metrics aligned more closely with human ratings. Claude 3.5 Haiku's strong performance suggests that advanced LLMs could provide even better evaluations. LLM-based approaches offer more human-aligned results, but further research is needed on computational costs and biases.",
  },
  {
    id: "tone-identification",
    name: "Tone Identification",
    description: "Assesses how accurately LLMs can identify and maintain specific tones",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Tone%20Identification%20%29%20%281%29-mjeo6TFlQ7ffs7el3UaIrPKKVctNjm.csv",
    summary:
      "Claude, Anthropic's LLM, outperformed IBM Watson's NLP and other models in tone classification, achieving the highest accuracy in both specific and general tone classification. It consistently outperformed lexicon-based models like VADER and IBM Watson across key metrics such as precision, recall, and F1 score. Although Claude performed slightly worse on a specific dataset, it still showed strong results overall, with RoBERTa outperforming it on this dataset due to its fine-tuning for sentiment analysis. These findings emphasize that transformer-based LLMs like Claude are better at capturing nuanced contextual information, offering flexibility and strong baseline performance, making them well-suited for real-world sentiment and tone analysis tasks.",
  },
  {
    id: "toxicity-detection",
    name: "Toxicity Detection",
    description: "Evaluates how well frameworks detect harmful or inappropriate content",
    dataUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capstone%20Dashboard%20Data%28Toxicity%20Detection%29-5PZm8regNQvQp1Gn85BbYwFiN7OXFW.csv",
    summary:
      "The LLM-as-a-judge method outperformed the NLP-based classifier for toxicity detection, achieving higher accuracy and a more balanced precision-recall trade-off. In contrast, the DistilBERT model detected nearly all toxic comments but generated many false positives.",
  },
]

// Helper function to determine if a metric is "higher is better" or "lower is better"
const isHigherBetter = (metricName) => {
  const lowerIsBetter = ["error", "mape", "mae", "rmse", "run time"]
  return !lowerIsBetter.some((term) => metricName.toLowerCase().includes(term))
}

// Update the getScoreColor function to handle correlation coefficients better
function getScoreColor(score, metricName) {
  // For correlation coefficients (summarization metrics)
  if (["coherence", "consistency", "fluency", "relevance", "average"].includes(metricName.toLowerCase())) {
    // Adjusted thresholds for correlation coefficients that typically range from -1 to +1
    // For summarization where values are typically around 0.25
    if (score >= 0.2) return "score-excellent"
    if (score >= 0.15) return "score-good"
    if (score >= 0.1) return "score-average"
    if (score >= 0.05) return "score-below-average"
    return "score-poor"
  }

  // For Mean Reciprocal Rank (0-1 scale)
  if (metricName.toLowerCase().includes("mean reciprocal rank")) {
    if (score >= 0.8) return "score-excellent"
    if (score >= 0.6) return "score-good"
    if (score >= 0.4) return "score-average"
    if (score >= 0.2) return "score-below-average"
    return "score-poor"
  }

  // For metrics where lower is better (like MAPE)
  if (!isHigherBetter(metricName)) {
    if (score < 5) return "score-excellent"
    if (score < 10) return "score-good"
    if (score < 15) return "score-average"
    if (score < 20) return "score-below-average"
    return "score-poor"
  }

  // For metrics where higher is better (like accuracy)
  if (score >= 80) return "score-excellent"
  if (score >= 70) return "score-good"
  if (score >= 60) return "score-average"
  if (score >= 50) return "score-below-average"
  return "score-poor"
}

// Replace the existing formatMetricValue function with this updated version
function formatMetricValue(value, metricName) {
  // Convert to number if it's a string
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Handle NaN or undefined
  if (isNaN(numValue) || numValue === undefined) return "N/A"

  // Format run time as minutes and seconds
  if (metricName.toLowerCase().includes("run time")) {
    const minutes = Math.floor(numValue / 60)
    const seconds = Math.round(numValue % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // For summarization metrics (correlation coefficients)
  if (["coherence", "consistency", "fluency", "relevance", "average"].includes(metricName.toLowerCase())) {
    // Display correlation coefficients with appropriate precision
    return numValue.toFixed(2)
  } else if (metricName.toLowerCase().includes("mean reciprocal rank")) {
    // For Mean Reciprocal Rank (0-1 scale)
    return numValue.toFixed(2)
  } else if (metricName.toLowerCase().includes("error") || metricName.toLowerCase().includes("mape")) {
    // For error metrics
    return numValue.toFixed(3)
  } else {
    // For percentage-like metrics
    return `${numValue.toFixed(1)}%`
  }
}

// Helper function to determine if a metric should be displayed as a percentage
function isPercentageMetric(metricName) {
  const nonPercentageMetrics = [
    "coherence",
    "consistency",
    "fluency",
    "relevance",
    "average",
    "error",
    "mape",
    "mae",
    "rmse",
    "mean reciprocal rank",
  ]
  return !nonPercentageMetrics.some((term) => metricName.toLowerCase().includes(term.toLowerCase()))
}

function hasCautionFlag(framework) {
  return framework.cautionFlag === "1"
}

// Update the App component to include method filtering
function App() {
  const [activeTab, setActiveTab] = useState("accuracy-retrieval") // Updated default tab to first alphabetical tab
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedFramework, setSelectedFramework] = useState(null)
  const [categoryData, setCategoryData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [methodFilter, setMethodFilter] = useState("all") // Add method filter state

  // Fetch data for all categories on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      try {
        const allData = {}

        for (const category of categories) {
          const data = await fetchAndProcessData(category.dataUrl)
          allData[category.id] = data
        }

        setCategoryData(allData)

        // Set default sort key for the active tab
        if (allData[activeTab] && allData[activeTab].metrics.length > 0) {
          setSortKey(allData[activeTab].metrics[0].id)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

  // Update sort key when changing tabs
  useEffect(() => {
    if (categoryData[activeTab] && categoryData[activeTab].metrics.length > 0) {
      // For accuracy-retrieval tab, prioritize F1 score
      if (activeTab === "accuracy-retrieval") {
        const metrics = categoryData[activeTab].metrics
        const f1Match = metrics.find(
          (m) =>
            m.id.toLowerCase() === "f-1 score" ||
            m.id.toLowerCase() === "f1 score" ||
            m.id.toLowerCase() === "f1-score",
        )

        if (f1Match) {
          setSortKey(f1Match.id)
        } else {
          setSortKey(metrics[0].id)
        }
      } else {
        // For other tabs, use the original logic
        const preferredMetrics = ["f-1 score", "f1 score", "accuracy", "average"]
        const metrics = categoryData[activeTab].metrics
        let foundPreferred = false

        for (const preferred of preferredMetrics) {
          const match = metrics.find((m) => m.id.toLowerCase() === preferred.toLowerCase())
          if (match) {
            setSortKey(match.id)
            foundPreferred = true
            break
          }
        }

        // If no preferred metric found, use the first one
        if (!foundPreferred) {
          setSortKey(metrics[0].id)
        }
      }
    }
  }, [activeTab, categoryData])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      // Set direction based on whether higher is better for this metric
      setSortDirection(isHigherBetter(key) ? "desc" : "asc")
    }
  }

  const handleFrameworkClick = (framework) => {
    setSelectedFramework(framework)
  }

  const handleCloseModal = () => {
    setSelectedFramework(null)
  }

  // Get current category data
  const currentCategory = categories.find((c) => c.id === activeTab)
  const currentData = categoryData[activeTab] || { frameworks: [], metrics: [] }

  // Add this function to get available methods for filtering
  const getAvailableMethods = () => {
    if (!categoryData[activeTab]) return []

    const methods = new Set()
    categoryData[activeTab].frameworks.forEach((framework) => {
      if (framework.method) {
        methods.add(framework.method)
      }
    })

    return Array.from(methods)
  }

  // Update the filtered frameworks logic
  const availableMethods = getAvailableMethods()

  // Filter frameworks based on method filter and accuracy values
  const filteredFrameworks = currentData.frameworks.filter((framework) => {
    // Only apply method filter
    if (methodFilter !== "all" && framework.method !== methodFilter) {
      return false
    }
    return true
  })

  // Sort the filtered frameworks
  const sortedFrameworks = [...filteredFrameworks].sort((a, b) => {
    const valueA = a.metrics[sortKey] !== undefined ? a.metrics[sortKey] : Number.NEGATIVE_INFINITY
    const valueB = b.metrics[sortKey] !== undefined ? b.metrics[sortKey] : Number.NEGATIVE_INFINITY

    // Handle missing values
    if (valueA === Number.NEGATIVE_INFINITY && valueB === Number.NEGATIVE_INFINITY) return 0
    if (valueA === Number.NEGATIVE_INFINITY) return 1
    if (valueB === Number.NEGATIVE_INFINITY) return -1

    // For metrics where lower is better, reverse the sort direction
    const effectiveDirection = isHigherBetter(sortKey) ? sortDirection : sortDirection === "asc" ? "desc" : "asc"

    return effectiveDirection === "asc" ? valueA - valueB : valueB - valueA
  })

  // Filter frameworks with caution flags
  const cautionFlaggedFrameworks = sortedFrameworks.filter(hasCautionFlag)
  // Filter frameworks without caution flags
  const regularFrameworks = sortedFrameworks.filter((framework) => !hasCautionFlag(framework))

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading evaluation data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  // Update the leaderboard controls section to include method filter
  return (
    <div className="app">
      {/* Header remains the same */}
      <header className="header">
        <div className="container">
          <h1>LLM Evaluation Framework Leaderboard</h1>
          <p className="updated-date">Updated: May 2, 2025</p>
        </div>
      </header>

      <main className="container">
        {/* Tabs remain the same */}
        <div className="tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`tab ${activeTab === category.id ? "active" : ""}`}
              onClick={() => setActiveTab(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {/* Category header remains the same */}
          <div className="category-header">
            <h2>{currentCategory.name}</h2>
            <p>{currentCategory.description}</p>
          </div>

          <div className="leaderboard-controls">
            <div className="leaderboard-info">Showing {sortedFrameworks.length} frameworks</div>
            <div className="filters">
              {availableMethods.length > 0 && (
                <div className="filter-control">
                  <label>Method:</label>
                  <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                    <option value="all">All Methods</option>
                    {availableMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortKey || ""} onChange={(e) => handleSort(e.target.value)}>
                {currentData.metrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name}
                  </option>
                ))}
              </select>
              <button
                className="sort-direction"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                title={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-column">Rank</th>
                  <th>Framework</th>
                  {/* Add Dataset column if available */}
                  {sortedFrameworks.some((f) => f.dataset) && <th>Dataset</th>}
                  {currentData.metrics.map((metric) => (
                    <th
                      key={metric.id}
                      className={`sortable ${sortKey === metric.id ? "active" : ""}`}
                      onClick={() => handleSort(metric.id)}
                    >
                      {metric.name} {sortKey === metric.id && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regularFrameworks.map((framework, index) => (
                  <tr
                    key={`${framework.name}-${index}`}
                    className="framework-row"
                    onClick={() => handleFrameworkClick(framework)}
                  >
                    <td className="rank-column">
                      <div className={`rank-badge ${index < 3 ? `top-${index + 1}` : ""}`}>{index + 1}</div>
                    </td>
                    <td>
                      <div className="framework-name">{framework.name}</div>
                      <div className="framework-org">
                        {framework.provider || "N/A"}
                        {framework.method && <span className="framework-method"> • {framework.method}</span>}
                      </div>
                    </td>
                    {/* Add Dataset column if available */}
                    {sortedFrameworks.some((f) => f.dataset) && (
                      <td className="dataset-column">{framework.dataset || "N/A"}</td>
                    )}
                    {currentData.metrics.map((metric) => {
                      const value = framework.metrics[metric.id]
                      const displayValue = value !== undefined ? value : "N/A"
                      const isPercentage = isPercentageMetric(metric.name)
                      const isCorrelation = ["coherence", "consistency", "fluency", "relevance", "average"].includes(
                        metric.name.toLowerCase(),
                      )
                      const isMRR = metric.name.toLowerCase().includes("mean reciprocal rank")

                      // Calculate normalized value based on metric type
                      let normalizedValue
                      if (isCorrelation) {
                        // For correlation coefficients (-1 to +1), normalize to 0-100%
                        // Center point (0) should be at 50%
                        normalizedValue = ((value + 1) / 2) * 100
                      } else if (isMRR) {
                        // For Mean Reciprocal Rank (0-1), normalize to 0-100%
                        normalizedValue = value * 100
                      } else if (isPercentage) {
                        normalizedValue = displayValue
                      } else {
                        normalizedValue = Math.min(displayValue * 5, 100)
                      }

                      return (
                        <td key={metric.id}>
                          <div
                            className={`score ${value !== undefined ? getScoreColor(displayValue, metric.name) : ""}`}
                          >
                            {value !== undefined ? formatMetricValue(displayValue, metric.name) : "N/A"}
                          </div>
                          {value !== undefined && (
                            <div className="progress-bar">
                              <div
                                className={`progress ${getScoreColor(displayValue, metric.name)}`}
                                style={{
                                  width: `${isHigherBetter(metric.name) ? normalizedValue : 100 - normalizedValue}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Caution Flagged Frameworks Table */}
            {activeTab === "hallucination" && cautionFlaggedFrameworks.length > 0 && (
              <>
                <div className="caution-flag-notice">
                  <div className="caution-flag-icon">⚠️</div>
                  <p>
                    The following frameworks have been flagged for caution. Results may not be fully accurate or may
                    require additional verification.
                  </p>
                </div>

                <table className="leaderboard-table caution-table">
                  <thead>
                    <tr>
                      <th className="rank-column">Rank</th>
                      <th>Framework</th>
                      {/* Add Dataset column if available */}
                      {sortedFrameworks.some((f) => f.dataset) && <th>Dataset</th>}
                      {currentData.metrics.map((metric) => (
                        <th key={metric.id}>{metric.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cautionFlaggedFrameworks.map((framework, index) => (
                      <tr
                        key={`caution-${framework.name}-${index}`}
                        className="framework-row caution-row"
                        onClick={() => handleFrameworkClick(framework)}
                      >
                        <td className="rank-column">
                          <div className="rank-badge caution-badge">⚠️</div>
                        </td>
                        <td>
                          <div className="framework-name">{framework.name}</div>
                          <div className="framework-org">
                            {framework.provider || "N/A"}
                            {framework.method && <span className="framework-method"> • {framework.method}</span>}
                          </div>
                        </td>
                        {/* Add Dataset column if available */}
                        {sortedFrameworks.some((f) => f.dataset) && (
                          <td className="dataset-column">{framework.dataset || "N/A"}</td>
                        )}
                        {currentData.metrics.map((metric) => {
                          const value = framework.metrics[metric.id]
                          const displayValue = value !== undefined ? value : "N/A"

                          return (
                            <td key={metric.id}>
                              <div className="score caution-score">
                                {value !== undefined ? formatMetricValue(displayValue, metric.name) : "N/A"}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="category-summary">
            <h3>Summary & Recommendations</h3>
            <p>{currentCategory.summary}</p>

            <div className="recommendations">
              {
                <div className="recommendation-card">
                  <h4>Best Overall</h4>
                  <div className="recommendation-content">
                    <div className="framework-badge">
                      {activeTab === "hallucination"
                        ? regularFrameworks[0]?.name || "N/A"
                        : sortedFrameworks[0]?.name || "N/A"}
                    </div>
                    <div className="recommendation-score">
                      {sortKey &&
                        (activeTab === "hallucination"
                          ? regularFrameworks[0]?.metrics[sortKey] !== undefined
                            ? formatMetricValue(regularFrameworks[0].metrics[sortKey], sortKey)
                            : "N/A"
                          : sortedFrameworks[0]?.metrics[sortKey] !== undefined
                            ? formatMetricValue(sortedFrameworks[0].metrics[sortKey], sortKey)
                            : "N/A")}
                    </div>
                  </div>
                </div>
              }

              {currentData.metrics.slice(0, 3).map((metric) => {
                // Sort frameworks by this specific metric
                const frameworksToConsider =
                  activeTab === "hallucination"
                    ? [...currentData.frameworks].filter((f) => !hasCautionFlag(f))
                    : [...currentData.frameworks]

                const sortedByMetric = frameworksToConsider
                  .filter((f) => f.metrics[metric.id] !== undefined)
                  .sort((a, b) => {
                    const valueA = a.metrics[metric.id]
                    const valueB = b.metrics[metric.id]
                    return isHigherBetter(metric.name) ? valueB - valueA : valueA - valueB
                  })

                const bestFramework = sortedByMetric[0]

                return bestFramework ? (
                  <div className="recommendation-card" key={metric.id}>
                    <h4>Best for {metric.name}</h4>
                    <div className="recommendation-content">
                      <div className="framework-badge">{bestFramework.name}</div>
                      <div className="recommendation-score">
                        {formatMetricValue(bestFramework.metrics[metric.id], metric.name)}
                      </div>
                    </div>
                  </div>
                ) : null
              })}
            </div>
          </div>
        </div>
      </main>

      {selectedFramework && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseModal}>
              ×
            </button>
            <h2>
              {selectedFramework.name}
              {hasCautionFlag(selectedFramework) && (
                <span className="framework-caution-flag">
                  <span role="img" aria-label="Warning">
                    ⚠️
                  </span>{" "}
                  Caution
                </span>
              )}
            </h2>
            <div className="framework-details">
              <p className="framework-org-modal">{selectedFramework.provider || "Unknown Provider"}</p>
              <p className="framework-description">
                {hasCautionFlag(selectedFramework) && (
                  <div className="caution-flag-notice" style={{ marginBottom: "15px" }}>
                    <div className="caution-flag-icon">⚠️</div>
                    <p>
                      This framework has been flagged for caution. Results may not be fully accurate or may require
                      additional verification.
                    </p>
                  </div>
                )}
                {selectedFramework.method && (
                  <span>
                    <strong>Method:</strong> {selectedFramework.method}
                    <br />
                  </span>
                )}
                {selectedFramework.dataset && (
                  <span>
                    <strong>Dataset:</strong> {selectedFramework.dataset}
                    <br />
                  </span>
                )}
                {selectedFramework.docsUrl && (
                  <span>
                    <strong>Documentation:</strong>{" "}
                    <a href={selectedFramework.docsUrl} target="_blank" rel="noopener noreferrer">
                      {selectedFramework.docsUrl}
                    </a>
                  </span>
                )}
              </p>

              <div className="metrics-summary">
                {currentData.metrics.map((metric) => (
                  <div className="metric-card" key={metric.id}>
                    <div className="metric-title">{metric.name}</div>
                    <div
                      className={`metric-value ${
                        selectedFramework.metrics[metric.id] !== undefined
                          ? getScoreColor(selectedFramework.metrics[metric.id], metric.name)
                          : ""
                      }`}
                    >
                      {selectedFramework.metrics[metric.id] !== undefined
                        ? formatMetricValue(selectedFramework.metrics[metric.id], metric.name)
                        : "N/A"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="framework-comparison">
                <h3>How {selectedFramework.name} Compares</h3>
                <div className="comparison-chart">
                  {currentData.metrics.slice(0, 4).map((metric) => {
                    // Find where this framework ranks for this metric
                    const sortedForMetric = [...currentData.frameworks]
                      .filter((f) => f.metrics[metric.id] !== undefined)
                      .sort((a, b) => {
                        const valueA = a.metrics[metric.id]
                        const valueB = b.metrics[metric.id]
                        return isHigherBetter(metric.name) ? valueB - valueA : valueA - valueB
                      })

                    const rank = sortedForMetric.findIndex((f) => f.name === selectedFramework.name) + 1
                    const total = sortedForMetric.length

                    return (
                      <div className="comparison-item" key={metric.id}>
                        <div className="comparison-label">{metric.name}</div>
                        <div className="comparison-rank">
                          Rank: <strong>{rank}</strong> of {total}
                        </div>
                        <div className="comparison-bar-container">
                          <div
                            className={`comparison-bar ${getScoreColor(selectedFramework.metrics[metric.id], metric.name)}`}
                            style={{ width: `${(1 - (rank - 1) / Math.max(total - 1, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="usage-guide">
                <h3>Implementation Notes</h3>
                <ul>
                  <li>
                    <strong>Method:</strong> {selectedFramework.method || "Not specified"}
                  </li>
                  <li>
                    <strong>Dataset:</strong> {selectedFramework.dataset || "Not specified"}
                  </li>
                  <li>
                    <strong>Provider:</strong> {selectedFramework.provider || "Not specified"}
                  </li>
                  {selectedFramework.docsUrl && (
                    <li>
                      <strong>Documentation:</strong>{" "}
                      <a href={selectedFramework.docsUrl} target="_blank" rel="noopener noreferrer">
                        View Documentation
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container">
          <p>© 2025 LLM Evaluation Framework Leaderboard</p>
        </div>
      </footer>
    </div>
  )
}

export default App
