import json
from pprint import pprint
import psycopg2

with open('../2019-03-20.json') as f:
    data = json.load(f)

def read_data():
    for minutes in data:

        minutes_key = list(minutes.keys())[0]

        if (minutes_key == "18:00"):
            break

        for price in minutes[minutes_key]:
            """
            id | created | price_time | ibov_price | mini_index | dol

            {'time': '17:41:04 (UTC-3)', 'ibov': '99588.38', 'mini-index': '99945.0', 'dol': '3792.0'}
            {'time': '17:41:09 (UTC-3)', 'ibov': '99588.38', 'mini-index': '99945.0', 'dol': '3792.0'}
            """

            price['time'] = '2019-03-19 ' + price['time'].replace(" (UTC-3)", '')
            insert_price(price)


def insert_price(price):
    connection = True
    print("insert_price")

    try:
        print("try")
        connection = psycopg2.connect(user="postgres",
                                        password="postgre",
                                        host="127.0.0.1",
                                        port="5432",
                                        database="ibov")

        cursor = connection.cursor()

        postgres_insert_query = """ INSERT INTO "public".prices (created, price_time, ibov_price, mini_index, dol) VALUES (%s,%s,%s,%s,%s)"""
        record_to_insert = ('now()', price['time'], price['ibov'], price['mini-index'], price['dol'])
        
        cursor.execute(postgres_insert_query, record_to_insert)
        connection.commit()

        print("Inserted?")

        count = cursor.rowcount
        print (count, "Record inserted successfully into mobile table")
    except (Exception, psycopg2.Error) as error :
        if(connection):
            print("Failed to insert record into mobile table", error)
    finally:
        #closing database connection.
        if(connection):
            cursor.close()
            connection.close()
            print("PostgreSQL connection is closed")

    print("FInish")

read_data()