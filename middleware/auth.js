//TODO Placeholder for admin/account page security
module.exports = function ensureAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');
    }
};
