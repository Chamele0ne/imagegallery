import React, { useState, useEffect, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { saveAs } from 'file-saver';
import JSZip from 'jszip';


export const Collection = () => {
    let db;
    let openRequest;
    let transaction;
    let store;
    let fileRef = useRef()
    const title = useParams().title
    const [state, setState] = useState([])
    const history = useHistory()

    function refreshImages() {
        let dbVersion = window.localStorage.getItem('dbVersion')

        openRequest = indexedDB.open('DatabaseImages', Number(dbVersion) || 1)
        openRequest.onupgradeneeded = () => {
            db = openRequest.result;//берем готовый обьект БД

        }
        openRequest.onerror = (e) => {
            console.log(e.message)
        }
        openRequest.onsuccess = async (e) => {
            db = openRequest.result;
            transaction = db.transaction(title, 'readwrite')
            store = transaction.objectStore(title)
            store.getAll().onsuccess = function (event) {
                setState([...event.target.result])
            }
        }

    }

    useEffect(()=>{
        refreshImages()
    },[])

    function submitHandler(event) {
        let dbVersion = window.localStorage.getItem('dbVersion')
        event.preventDefault()
        if (fileRef.current) {
            let reader = new FileReader()
            reader.readAsDataURL(fileRef.current)
            reader.onload = (event) => {
                openRequest = indexedDB.open('DatabaseImages', dbVersion)
                openRequest.onsuccess = () => {
                    db = openRequest.result
                    transaction = db.transaction(title, 'readwrite')
                    store = transaction.objectStore(title).put({ name: fileRef.current.name, path: reader.result })
                    refreshImages()
                }
            }
        }
    }

    function clearHandeler(event) {
        event.preventDefault()
        let dbVersion = window.localStorage.getItem('dbVersion')
        if (!dbVersion) { window.localStorage.setItem('dbVersion', 1) }
        openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
        openRequest.onsuccess = () => {
            db = openRequest.result;
            transaction = db.transaction(title, 'readwrite')
            store = transaction.objectStore(title)
            store.clear()
            refreshImages()
        }
    }

    function dowloadZIP() {
        var zip = new JSZip();

        for (let i = 0; i <= state.length - 1; i++) {
            let index = state[i].path.indexOf(',')
            let imageData = state[i].path.slice(index + 1)
            let file = zip.folder('images')
            file.file(state[i].name, imageData, { base64: true })

        }

        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                saveAs(content, "example.zip");
            });
    }

    return (
        <div className='container pt-4'>
            <h1 className='text-white'>Коллекция : {title}</h1>
            <div >
                <form encType="multupart/form-data" method="POST" onSubmit={(event) => submitHandler(event)}>
                    <div className="form-group">
                        <input
                            type='file'
                            className='upload-box'
                            onChange={(event) => {
                                fileRef.current = event.target.files[0]
                            }}
                        />
                    </div>
                    <div className='d-flex'>
                        <button className='btn-add'>Добавить </button>
                        <button className='btn-clear ' onClick={(event) => clearHandeler(event)}>Очистить хранилище</button>
                        {state.length ? <button className='btn-add' onClick={() => dowloadZIP()} >Скачать архив</button> : null}
                        <button className='btn-add ' onClick={() => history.push('./')}>Назад</button>
                    </div>
                </form>



                <div className='row pt-4'>
                    {state.length ? state.map((item, index) => <div key={index} className='col-lg-4 mb-4'>
                        <img
                            id='image'
                            alt=''
                            src={item.path} style={{
                                maxHeight: '300px',
                                maxWidth: '300px',
                                margin: '5px',
                                borderRadius: '20px'
                            }}
                        />
                        <a download={item.name} href={item.path} className='btn btn-secondary'>Загрузить</a>
                    </div>): null}
                </div>
            </div>
        </div>
    )
}