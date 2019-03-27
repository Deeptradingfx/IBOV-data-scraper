import json
from pprint import pprint
import psycopg2
import os

filePath = '/media/lucas/Dados/Development/master/ibov-data/historical/dolar/'

def parse_date_from_file(name):
    bla = name.replace(".json", "").split("-")
    right_date = "2019-{}-{}".format( str(bla[1]).zfill(2), str(bla[0]).zfill(2) )

    return right_date

def read_data():
    with open( filePath ) as f:
        data = json.load(f)

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

            price['time'] = file_name + ' ' + price['time'].replace(" (UTC-3)", '')

            # print(price)
            insert_price(price)

def read_historical_data(file_name):
    with open( file_name ) as f:
        try:
            data = json.load(f)
        except Exception as error:
            print(error)
            return
        

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

            try:
                price['time'] = parse_date_from_file(file_name) + ' ' + price['time'].replace(" (UTC-3)", '')
            except Exception as error:
                pass

            insert_price(price)

def clean_json(file_name):
    # Read in the file
    with open(filePath + "/" + file_name, 'r') as file :
        filedata = file.read()

    filedata = filedata.replace(']}', ']},')

    filedata = "[" + filedata[0:len(filedata) - 1] + "]"

    # Write the file out again
    with open(file_name, 'w') as file:
        file.write(filedata)

def insert_price(price):
    connection = True

    try:
        connection = psycopg2.connect(user="postgres",
                                        password="postgres",
                                        host="127.0.0.1",
                                        port="5433",
                                        database="postgres")

        cursor = connection.cursor()

        postgres_insert_query = """ INSERT INTO "test".prices (created, price_time, ibov_price, mini_index, dol) VALUES (%s,%s,%s,%s,%s)"""
        record_to_insert = ('now()', 
                                price['time'] if price['time'] else None, 
                                price['ibov'] if 'ibov' in price else None, 
                                price['mini-index'] if 'mini-index' in price else None,
                                price['dol'] if 'dol' in price else None)
        # print(record_to_insert)
        cursor.execute(postgres_insert_query, record_to_insert)
        connection.commit()

        count = cursor.rowcount
    except (Exception, psycopg2.Error) as error :
        print(error)
        if(connection):
            print("Failed to insert record into mobile table", error)
    finally:
        #closing database connection.
        if(connection):
            cursor.close()
            connection.close()
            # print("PostgreSQL connection is closed")


# read_data()

for filename in os.listdir(filePath):
    clean_json(filename)
    read_historical_data(filename)