import JSZip from 'jszip';
import React, { useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { saveAs } from 'file-saver';

export const Gallery = () => {

    let db;
    let store;
    let openRequest;
    let transaction;
    let dbVersion;
    const fileRef = useRef(null)
    const history = useHistory()
    const [volume, setVolume] = useState({ empty: '', engaged: '' })
    const [flag, setFlag] = useState(false)
    const [state, setState] = useState([])
    const [size, setSize] = useState({ width: '', height: '' })
    const [format, setFormat] = useState('')
    const [search, setSearch] = useState('')
    const [discription, setDiscription] = useState('')
    const [flagDiscription, setFlagDiscription] = useState(false)
    const [stores, setStores] = useState([])
    function navStorage() {
        if (navigator.storage && navigator.storage.estimate) {
            return async function () {
                const quota = await navigator.storage.estimate()
                const percentageUsed = (quota.usage / quota.quota) * 100
                console.log(`Вы использовали ${percentageUsed}% хранилища`)
                const remaining = quota.quota - quota.usage
                console.log(`Вам доступно еще ${remaining} байт`)
                setVolume({ empty: remaining, engaged: quota.usage })
            }()

        }

    }
    useEffect(() => {
        navStorage()
    }, [state])

    function refreshImages() {
        dbVersion = window.localStorage.getItem('dbVersion')
        if (!dbVersion) { window.localStorage.setItem('dbVersion', 1) }
        openRequest = indexedDB.open('DatabaseImages', dbVersion)
        openRequest.onupgradeneeded = () => {
            db = openRequest.result;
            if (!db.objectStoreNames.contains('images')) {
                store = db.createObjectStore('images', { keyPath: 'name' });
            }
        }
        openRequest.onerror = (e) => {
            console.log(e)
        }
        openRequest.onsuccess = (e) => {
            db = openRequest.result;
            transaction = db.transaction('images', 'readwrite')
            store = transaction.objectStore('images')
            store.getAll().onsuccess = function (event) {
                setState([...event.target.result])
            }
            let values = Object.values(e.target.result.objectStoreNames)
            setStores(values)
        }
    }

    useEffect(() => {
        refreshImages()
    },[])

    function getSize(event) {

        if (fileRef.current) {
            let image = new Image()
            let reader = new FileReader();
            reader.readAsDataURL(event.target.files[0])
            reader.onloadend = function (e) {
                image.src = e.target.result
            }
            image.onload = function () {
                console.log(image.width + " " + image.height);
                setSize({ width: image.width, height: image.height })

                if (image.width > image.height) {
                    setFormat('Альбом')
                } else if (image.width < image.height) {
                    setFormat('Портрет')
                } else if (image.width === image.height) { setFormat('Квадрат') }
            }
        }
    }

    function objectToPost(src) {

        let weekDay = Date.now()
        let time = new Date()
        time = time.toLocaleString()
        weekDay = new Intl.DateTimeFormat('ru', {
            weekday: 'long',
        }).format(weekDay)
        let created = weekDay + ' ' + time
        let weight = (fileRef.current.size / 1048576).toFixed(2) + ' MB'
        let obj = {
            name: fileRef.current.name,
            path: src,
            created: created,
            weight: weight,
            mimetype: fileRef.current.type,
            size: size,
            format: format,
            discription: discription
        }
        return { obj }
    }

    function submitHandler(event) {

        if (fileRef.current) {
            let reader = new FileReader()
            reader.readAsDataURL(fileRef.current)
            reader.onload = () => {
                dbVersion = window.localStorage.getItem('dbVersion')
                openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
                openRequest.onsuccess = () => {
                    db = openRequest.result
                    transaction = db.transaction('images', 'readwrite')
                    const { obj } = objectToPost(reader.result)
                    store = transaction.objectStore('images').put(obj)
                    setFlagDiscription(false)
                    refreshImages()
                }
            }
        }
    }

    function removeHandler(event, item) {
        event.preventDefault()
        dbVersion = window.localStorage.getItem('dbVersion')
        openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
        openRequest.onsuccess = () => {
            db = openRequest.result
            let transaction = db.transaction('images', 'readwrite')
            let store = transaction.objectStore('images')
            store.delete(item.name)
            refreshImages()
        }
    }

    function changeHandler(event, item) {
        event.preventDefault()
        if (fileRef.current) {
            let reader = new FileReader()
            reader.readAsDataURL(fileRef.current)
            reader.onload = () => {
                dbVersion = window.localStorage.getItem('dbVersion')
                openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
                openRequest.onsuccess = () => {
                    db = openRequest.result
                    transaction = db.transaction('images', 'readwrite')
                    store = transaction.objectStore('images')
                    const { obj } = objectToPost(reader.result)
                    obj.name = item.name
                    store.put(obj)
                    console.log('Изменено')
                    refreshImages()
                }
            }
        } else {
            openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
            openRequest.onsuccess = () => {
                db = openRequest.result
                transaction = db.transaction('images', 'readwrite')
                store = transaction.objectStore('images')
                item.discription = discription
                store.put(item)
                console.log('Изменено')
                refreshImages()
            }
        }
    }

    function clearHandler(event) {
        event.preventDefault()
        dbVersion = window.localStorage.getItem('dbVersion')
        openRequest = indexedDB.open('DatabaseImages', dbVersion || 1)
        openRequest.onsuccess = () => {
            db = openRequest.result;
            transaction = db.transaction('images', 'readwrite')
            store = transaction.objectStore('images')
            store.clear()
            refreshImages()
        }

    }

    function searchHandler(event) {
        event.preventDefault()
        if (search !== '' && state.length) {
            setFlag(true)
            const sort = state.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
            setState(sort)
        }
        setSearch('')
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
        <div className='container'>
            <h1 style={{ textAlign: 'center' }} className='text-white'>Галерея изображений</h1>
            <div className='d-flex justify-content-center m-4'>
                <p className='text-white'>Занято : {volume.engaged} &nbsp;&nbsp;/&nbsp;&nbsp; Свободно : {volume.empty}</p>
            </div>
            <div>
                <form onSubmit={(event) => searchHandler(event)}>
                    <div style={{ display: 'flex', margin: 'auto', justifyContent: 'center' }}>
                        <button type='submit' className='btn-search'
                            onClick={event => searchHandler(event)}>Поиск</button>
                        <input id="search"
                            placeholder='Search'
                            type="text"
                            className='search-box text-white'
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            onFocus={() => setFlagDiscription(false)}
                        />
                        {flag && <button className='btn btn-primary' onClick={() => {
                            setFlag(false)
                            refreshImages()
                        }}>Вернуться</button>}
                    </div>
                </form>
                {state.length && <button onClick={dowloadZIP}
                    className='btn-add' >Скачать архив</button>}
            </div>
            <div className='d-flex'
                style={{ paddingTop: '50px', width: '100%', position: 'relative' }}>
                <form encType="multupart/form-data" method="POST"
                    onSubmit={(event) => submitHandler(event)}
                    style={{ width: '50%' }}
                >
                    <input
                        type='file'
                        className='upload-box'
                        onChange={(event) => {
                            fileRef.current = event.target.files[0]
                            getSize(event)
                        }}
                    />
                </form>
                <div className=' d-flex ' style={{ width: '50%' }}>
                    <button className='btn-add' onClick={(event) => submitHandler(event)}>Добавить фото </button>
                    <button className='btn-clear' onClick={(event) => clearHandler(event)}>Очистить хранилище</button>
                    <button className='btn-add' style={{ minWidth: '190px' }}
                        onClick={() => {
                            setDiscription('')
                            setFlagDiscription(!flagDiscription)
                        }} >{!flagDiscription ? 'Добавить описание' : 'Убрать'}</button>
                   
                </div>
            </div>
            <div className='d-flex pt-4'>
                 <button className='btn-add' onClick={() => {
                        history.push('./createCol')
                        window.location.reload()
                    }}>Cоздать коллекцию</button>
            <button  className='btn btn-danger' 
            onClick={()=>{
                  history.push('./deleteCol')
                  window.location.reload()
                  console.log(stores)
            }}
          hidden ={stores.length <= 1 && true}>Удалить коллекицю</button>
            </div>
            <div>
                  <table>
                <tbody>
                    <tr className='mt-4 row'>{stores && stores.map((item, index) => item !== 'images' &&
                        <th key={index} >
                            <a
                                href={item}
                                style = {{minWidth : '100px'}}
                                className='btn  bg-dark text-white m-1'
                            >{item}</a>
                        </th>)}
                    </tr>
                </tbody>
            </table>
            </div>
            <div style={{ textAlign: 'center' }}>
                {flagDiscription && <textarea
                    id="discription"
                    placeholder='Введите описание'
                    type="text"
                    className='bg-light'
                    style={{
                        borderRadius: '20px',
                        width: '40%',
                        minHeight: '200px',
                        marginTop: '20px'
                    }}
                    value={discription}
                    onChange={event => setDiscription(event.target.value)}
                />}
            </div>
            <div className='row mt-3' >
                {state.length ? state.map((item, index) =>
                    <div key={index} className='col-md-4 mt-3' style={{ borderRadius: '20px', marginBottom: '50px' }}>
                        <div className="card shadow" style={{ width: '20rem', borderRadius: '20px ' }}>
                            <div className='zoom'>
                                <img src={item.path}
                                    style={{ borderRadius: '20px 20px 0px 0px', width: '100%', height: '250px' }}
                                    alt="..." />
                            </div>
                            <div className="card-body text-center" style={{ height: '340px', overflow: 'auto' }}>
                                <span className='text-white'>
                                    <p>Название: {item.name}</p>
                                    <p>Формат: {item.format}</p>
                                    <p> Размер: {item.size.height} x {item.size.width}</p>
                                    <p> Вес: {item.weight}</p>
                                    <p>type: {item.mimetype}</p>
                                    <p>Дата создания: {item.created}</p>
                                    {item.discription && <p>Описание : {item.discription}</p>}
                                </span>
                                <div className='d-flex'>
                                    <button className='btn btn-danger' onClick={(event) => removeHandler(event, item)}> Remove </button>
                                    <button className='btn btn-success' onClick={(event) => changeHandler(event, item)}> Change </button>
                                    <a download={item.name} href={item.path} className='btn btn-secondary'>Загрузить</a>
                                </div>

                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
