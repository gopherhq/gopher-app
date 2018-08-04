module.exports = function(gopherApp) {
  gopherApp.use((req, res, next) => {
    const gopher = res.locals.gopher;
    gopher.skills.overwrite = "z-test-skill";
    next();
  });
};