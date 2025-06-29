export const parseCSV = (text: string): any[] => {
  const lines = text.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    data.push(row)
  }

  return data
}
