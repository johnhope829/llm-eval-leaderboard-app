// Function to fetch and process CSV data
export async function fetchAndProcessData(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    const parsedData = parseCSV(csvText)

    return processData(parsedData)
  } catch (error) {
    console.error("Error fetching or processing data:", error)
    throw error
  }
}

// Parse CSV text into array of objects
function parseCSV(csvText) {
  const lines = csvText.split("\n")
  const headers = lines[0].split(",").map((header) => header.trim())

  const result = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines

    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) {
      console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`)
      // Pad or truncate values to match headers length
      while (values.length < headers.length) values.push("")
      values.length = headers.length
    }

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })

    result.push(row)
  }

  return result
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Update the processData function to handle the caution flag
function processData(data) {
  // Extract all possible metric columns
  const metricColumns = Object.keys(data[0] || {}).filter(
    (key) => !["Method", "Provider", "Docs URL", "Framework", "Dataset", "Caution Flag", ""].includes(key),
  )

  // Create metrics array with id and name
  const metrics = metricColumns.map((column) => ({
    id: column.toLowerCase().replace(/\s+/g, "-"),
    name: column,
  }))

  // Process frameworks
  const frameworks = data.map((row) => {
    const framework = {
      name: row["Framework"] || "Unknown",
      method: row["Method"] || "",
      provider: row["Provider"] || "",
      dataset: row["Dataset"] || "",
      docsUrl: row["Docs URL"] || "",
      cautionFlag: row["Caution Flag"] || "0", // Add caution flag handling
      metrics: {},
    }

    // Add metrics
    metrics.forEach((metric) => {
      const value = row[metric.name]
      if (value !== undefined && value !== "") {
        // Convert to number if possible
        const numValue = Number.parseFloat(value)

        // For summarization metrics (correlation coefficients), ensure they're treated as decimals
        if (["Coherence", "Consistency", "Fluency", "Relevance", "Average"].includes(metric.name)) {
          framework.metrics[metric.id] = isNaN(numValue) ? value : numValue
        }
        // For percentage metrics, ensure they're treated as percentages
        else if (["Accuracy", "Recall", "Precision", "F-1 Score"].includes(metric.name)) {
          framework.metrics[metric.id] = isNaN(numValue) ? value : numValue
        }
        // For other metrics
        else {
          framework.metrics[metric.id] = isNaN(numValue) ? value : numValue
        }
      }
    })

    return framework
  })

  return {
    frameworks,
    metrics,
  }
}
