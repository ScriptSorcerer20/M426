from flask import Flask, render_template, request, url_for, redirect, send_file, session, current_app, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from flask_migrate import Migrate
from datetime import datetime, timedelta
from flask import jsonify
import random
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from sqlalchemy.testing.suite.test_reflection import users
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

migrate = Migrate(app, db)


# User model
class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(250), unique=True, nullable=False)
    username = db.Column(db.String(250), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    mfa_code = db.Column(db.String(6))
    mfa_expires = db.Column(db.DateTime)
    mfa_enabled = db.Column(db.Boolean, default=True)


app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME="familie.braendli@gmail.com",
    MAIL_PASSWORD="snphriglmpowfaix",
)

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


mail = Mail(app)
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])


@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        username = request.form.get("username")
        password = request.form.get("password")

        if Users.query.filter_by(username=username).first():
            return render_template("sign_up.html", error="Username already taken!")

        if Users.query.filter_by(email=email).first():
            return render_template("sign_up.html", error="Email already used.")

        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = Users(email=email, username=username, password=hashed_password, is_verified=False)
        db.session.add(new_user)
        db.session.commit()

        token = s.dumps(email, salt='email-verify')
        verify_link = url_for('verify_email', token=token, _external=True)
        msg = Message("Verify your email", sender="noreply@yourapp.com", recipients=[email])
        msg.body = f"Click the link to verify your account: {verify_link}"
        mail.send(msg)

        flash("Registration successful! Please check your email to verify your account.", "success")
        return render_template("sign_up.html")
    return render_template("sign_up.html")


@app.route('/verify/<token>')
def verify_email(token):
    try:
        email = s.loads(token, salt='email-verify', max_age=300)
    except SignatureExpired:
        return render_template('sign_up.html', message="Token expired, please register again.")
    except BadSignature:
        return render_template('sign_up.html', message="Invalid verification token.")

    user = Users.query.filter_by(email=email).first()
    if not user:
        return "User not found."
    if user.is_verified:
        return render_template('login.html', message="Email already verified.")

    user.is_verified = True
    db.session.commit()

    flash("Email verified! You can now log in.", "success")
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if 'mfa_code' in request.form:
            user_id = session.get("mfa_user_id")
            user = Users.query.get(user_id)
            input_code = request.form.get("mfa_code")

            if user and user.mfa_code == input_code and user.mfa_expires > datetime.utcnow():
                session.pop("mfa_user_id", None)
                user.mfa_code = None
                user.mfa_expires = None
                db.session.commit()
                login_user(user)
                return redirect(url_for("home"))

            return render_template("login.html", show_mfa=True, error="Invalid or expired MFA code.")

        username = request.form.get("username")
        password = request.form.get("password")

        user = Users.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            if not user.is_verified:
                token = s.dumps(user.email, salt='email-verify')
                verify_link = url_for('verify_email', token=token, _external=True)
                msg = Message("Verify your email", sender="noreply@yourapp.com", recipients=[user.email])
                msg.body = f"Click the link to verify your account: {verify_link}"
                mail.send(msg)
                flash("Please verify your email before logging in.")
                return render_template("login.html")

            if user.mfa_enabled:
                mfa_code = str(random.randint(100000, 999999))
                user.mfa_code = mfa_code
                user.mfa_expires = datetime.utcnow() + timedelta(minutes=5)
                db.session.commit()

                msg = Message("Your MFA Code", sender="noreply@yourapp.com", recipients=[user.email])
                msg.body = f"Your MFA code is: {mfa_code}"
                mail.send(msg)

                session['mfa_user_id'] = user.id
                return render_template("login.html", show_mfa=True, message="MFA code sent to your email.")
            else:
                # MFA disabled: log in immediately
                login_user(user)
                session.permanent = True  # optional
                return redirect(url_for("home"))

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


@app.route('/settings', methods=["GET", "POST"])
@login_required
def settings():
    if request.method == "POST":
        enable = request.form.get("enable_mfa") == "on"
        current_user.mfa_enabled = enable
        db.session.commit()
        flash(f"MFA {'enabled' if enable else 'disabled'}.", "info")

    return render_template('account_settings.html', user=current_user)


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


@app.route('/settings', methods=["POST"])
@login_required
def change_email():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))

    user = Users.query.get(user_id)

    password = request.form.get("enter_password")
    new_email = request.form.get("new_email")

    # Check if current password is correct
    if new_email and new_email != user.email:
        if Users.query.filter_by(email=new_email).first():
            return render_template("account_settings.html", user=user, error="Email already in use.")
        user.email = new_email
        user.is_verified = False

    if not check_password_hash(user.password, password):
        return render_template("account_settings.html", user=user, error="Current password is incorrect.")

    # Update password
    user.email = new_email
    db.session.commit()

    return render_template("account_settings.html", user=user, success="Email changed successfully.")

@app.route('/settings', methods=['POST'])
@login_required
def toggle_mfa():
    data = request.get_json()
    enable = data.get('enable_mfa', False)

    user = current_user
    user.mfa_enabled = enable
    if not enable:
        user.mfa_code = None
        user.mfa_expires = None

    db.session.commit()
    return jsonify({"message": f"MFA {'enabled' if enable else 'disabled'}."})

if __name__ == "__main__":
    app.run(debug=True)
