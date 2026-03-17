const getTestStatus = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API BillboardEye fonctionne parfaitement",
  });
};

module.exports = {
  getTestStatus,
};
