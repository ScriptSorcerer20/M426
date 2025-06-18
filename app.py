from flask import Flask, render_template, request, url_for, redirect, send_file, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.sqlite import JSON
import os

# Initialize Flask app
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "supersecretkey"

# Initialize database and login manager
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# User model
class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(250), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship("Users", backref="orders")

class OrderProduct(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'))
    date = db.Column(db.String(100))
    product_name = db.Column(db.String(100), nullable=False)
    product_description = db.Column(db.String(255))
    product_price = db.Column(db.Float, nullable=False)
    kilocalories = db.Column(db.Integer)
    kilojoules = db.Column(db.Float)
    allergy = db.Column(JSON)
    order = db.relationship("Order", backref="items")

# Create database
with app.app_context():
    db.create_all()

# Load user for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

# Home route
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/products/<int:number>")
def products(number):
    directory = 'static/json'
    try:
        files = os.listdir(directory)
        if number < 0 or number >= len(files):
            return "Index out of range", 404
        selected_file = os.path.join(directory, files[number])
        return send_file(selected_file, mimetype='application/json')
    except Exception as e:
        return str(e), 500

@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if Users.query.filter_by(username=username).first():
            return render_template("sign_up.html", error="Username already taken!")
        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = Users(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for("login"))
    return render_template("sign_up.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        user = Users.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            login_user(user)
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error="Invalid username or password")

    return render_template("login.html")

# Protected dashboard route
@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", username=current_user.username)

# Logout route
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))

@app.route("/basket", methods=["GET", "POST"])
@login_required
def basket():
    order = request.form.get("order")
    return render_template("/basket.html")

@app.route('/settings')
@login_required
def settings():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))

    user = Users.query.get(user_id)
    return render_template('account_settings.html', user=user)

@app.route('/settings', methods=["POST"])
@login_required
def change_password():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))

    user = Users.query.get(user_id)

    current_password = request.form.get("current_password")
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirm_password")

    # Check if current password is correct
    if not check_password_hash(user.password, current_password):
        return render_template("account_settings.html", user=user, error="Current password is incorrect.")

    # Check if new passwords match
    if new_password != confirm_password:
        return render_template("account_settings.html", user=user, error="New passwords do not match.")

    # Update password
    user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
    db.session.commit()

    return render_template("account_settings.html", user=user, success="Password changed successfully.")

if __name__ == "__main__":
    app.run(debug=True)