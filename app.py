from flask import Flask, request, render_template,redirect,jsonify,url_for
from flask_cors import CORS
import pandas as pd
import joblib
import json
import time
import datetime
from datetime import timedelta
import statsmodels.api as sm
import scipy.stats as stats
# from train import train
import sqlite3
import numpy as np
import pickle as pickle

app = Flask(__name__)

model = joblib.load("model.sav")
scalerX = pickle.load(open("scalerX", "rb"))

@app.route('/')
def home():
    return render_template('login.html')

@app.route("/signup")
def signup():
    name = request.args.get('username','')
    dob = request.args.get('DOB','')
    sex = request.args.get('Sex','')
    contactno = request.args.get('CN','')
    email = request.args.get('email','')
    martial = request.args.get('martial','')
    password = request.args.get('psw','')

    con = sqlite3.connect('signup.db')
    cur = con.cursor()
    cur.execute("insert into `accounts` (`name`, `dob`,`sex`,`contact`,`email`,`martial`, `password`) VALUES (?, ?, ?, ?, ?, ?, ?)",(name,dob,sex,contactno,email,martial,password))
    con.commit()
    con.close()

    return render_template("login.html")

@app.route("/signin")
def signin():
    mail1 = request.args.get('uname','')
    password1 = request.args.get('psw','')
    con = sqlite3.connect('signup.db')
    cur = con.cursor()
    cur.execute("select `email`, `password` from accounts where `email` = ? AND `password` = ?",(mail1,password1,))
    data = cur.fetchone()

    if data == None:
        return render_template("login.html")

    elif mail1 == data[0] and password1 == data[1]:
        return render_template("index.html")

    
    else:
        return render_template("login.html")


@app.route('/register')
def register():
    return render_template("register.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route("/index", methods=['POST', 'GET'])
def index():
    if request.method == 'GET':
        return render_template("index.html")
    elif request.method == 'POST':
        region = request.form['feedback1']
        season = request.form['attendance']
        production = request.form['feedback']
        cropname = request.form['overtime']

            
        to_predict = [season,production,cropname]
        

        rf_result = model.predict(scalerX.transform([to_predict]))

        

        if rf_result[0] == 0:
            remarks = 'Good'
            to_predict1 = [region,season,production,cropname,remarks]
            result = 'Prediction of Yield in that Region : Good'
            return render_template("result.html", rf_result=result,to_predict=to_predict1)

        else:
            remarks = 'Poor'
            to_predict1 = [region,season,production,cropname,remarks]
            result = 'Prediction of Yield in that Region : Poor'
            return render_template("result.html", rf_result=result,to_predict=to_predict1)

if __name__ == "__main__":
    app.run(debug=True)