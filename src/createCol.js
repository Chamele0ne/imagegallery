import React , {useState} from 'react'
import { useHistory } from 'react-router-dom'
export const CreateCol = () => {
    const history = useHistory()
    const [value, setValue] = useState()

    function createHandler() {
        let dbVersion =  window.localStorage.getItem('dbVersion')
        window.localStorage.setItem('dbVersion', Number(dbVersion) + 1)
 
         if (value) {
             console.log('here')
             let open = indexedDB.open('DatabaseImages', Number(dbVersion) + 1)
             console.log('here')
 
             open.onupgradeneeded = () => {
                 console.log('here')
 
                 let db = open.result;
                 if (!db.objectStoreNames.contains(value)) {
                     console.log('here')
 
                     db.createObjectStore(value, { keyPath: 'name' })
                     window.location.reload()
                 }
             }
             history.push('./')
         }
         
     }
    return(
        <div className='container'>
          <div  className='center' style={{width : '300px'}}>
        <input type='text' 
        className='form-control' 
        onChange={e => setValue(e.target.value)}
        placeholder='Введите название коллекции'></input>
        <button onClick={() => createHandler()} className='btn btn-success' >Создать</button>
    </div>  
        </div>
        
    )
}