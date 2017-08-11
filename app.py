# -*- coding: utf-8 -*-

from flask import Flask
from flask import render_template
import json
import sqlite3


app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def get_data():
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    c.execute('''select c.name, e.timestamp, e.count 
                 from collections as c
                 join entries as e on c.id = e.collection ''')
    results = []
    for result in c.fetchall():
        results.append({
            'collection': result[0],
            'timestamp': result[1],
            'count': result[2]
        })

    return json.dumps(results)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
