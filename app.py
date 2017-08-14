# -*- coding: utf-8 -*-

from flask import Flask
from flask import render_template
import json
import sqlite3

app = Flask(__name__)


@app.route("/")
def index():
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    c.execute('''select distinct graph 
                 from collections 
                 order by graph asc;''')
    graphs = c.fetchall()
    conn.close()
    return render_template("index.html", graphs=graphs)


@app.route("/data")
def get_data():
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    c.execute('''select c.graph, c.name, e.timestamp, e.count 
                 from collections as c
                 join entries as e on c.id = e.collection
                 order by graph asc, lang asc;''')
    results = []
    for result in c.fetchall():
        results.append({
            'graph': result[0],
            'data_source': result[1],
            'timestamp': result[2],
            'count': result[3]
        })
    conn.close()
    return json.dumps(results)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
