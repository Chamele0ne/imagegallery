import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
export const DeleteCol = () => {

    const history = useHistory()
    const [value, setValue] = useState('')

    function deleteHandler() {
        let dbVersion = window.localStorage.getItem('dbVersion')
        window.localStorage.setItem('dbVersion', Number(dbVersion) + 1)

        if (value) {
            let open = indexedDB.open('DatabaseImages', Number(dbVersion) + 1)

            open.onupgradeneeded = () => {
                let db = open.result;
                if (db.objectStoreNames.contains(value)) {
                    db.deleteObjectStore(value)
                    history.push('./')
                }
            }
            open.onsuccess = () => {
                console.log('success')
            }
            open.onerror = (e) => {
                console.log(e)
            }
    
        }
    }
    return (
        <div className='container'>
            <div className='center' style={{ width: '300px' }}>
                <input type='text'
                    className='form-control'
                    onChange={e => setValue(e.target.value)}
                    placeholder='Введите название коллекции'></input>
                <button onClick={() => deleteHandler()} className='btn btn-danger' >Удалить</button>
            </div>
        </div>
    )
}