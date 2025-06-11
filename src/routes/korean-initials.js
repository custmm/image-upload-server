router.get("/korean-initials", async (req, res) => {
  try {
    const files = await File.findAll({
      attributes: ["file_description"],
      raw: true,
    });

    const tagSet = new Set();

    files.forEach(file => {
      const tags = file.file_description?.match(/#([가-힣a-zA-Z0-9_]+)/g);
      if (tags) {
        tags.forEach(tag => tagSet.add(tag.replace("#", "")));
      }
    });

    const sortedTags = [...tagSet].sort((a, b) => a.localeCompare(b, "ko"));
    res.json({ tags: sortedTags });
  } catch (error) {
    res.status(500).json({ error: "태그 로딩 실패" });
  }
});