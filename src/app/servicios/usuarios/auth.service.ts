import { Injectable } from '@angular/core';
import { Auth, FacebookAuthProvider, GoogleAuthProvider, TwitterAuthProvider, User, authState, sendEmailVerification, signInWithEmailAndPassword, signInWithRedirect, signInWithPopup, updateProfile, getAdditionalUserInfo } from '@angular/fire/auth';
import { Firestore, arrayUnion, collection, collectionData, doc, docData, getDoc, getDocs, query, setDoc, updateDoc, where} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { DataSharingService } from './data-sharing.service';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { Observable, map } from 'rxjs';

interface ErrorResponse  {
  code: string;
  message: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth, private router: Router, private dataSharingService: DataSharingService, private firestore: Firestore) { 
    // Ya no necesitamos manejar redirects
  }
  private readonly googleProvider = new GoogleAuthProvider();
  private readonly facebookProvider = new FacebookAuthProvider();
  private readonly twitterProvider = new TwitterAuthProvider();
  usuarioNuevo = false;

  get userState$(){
    return authState(this.auth);
  }

  //------------------------------------------------------------- FIRESTORE  --------------------------------------------

  getUsuarioId(id: string): Observable<Usuario>{
    const documentoUsuario = doc(this.firestore, 'usuarios', id);
    return docData(documentoUsuario).pipe(
      map(usuario => {
        return { ...usuario, id: id } as Usuario;
      })
    );
  }

  getUsuarioInternoId(id: string): Observable<Usuario>{
    const documentoUsuario = doc(this.firestore, 'usuarios-internos', id);
    return docData(documentoUsuario).pipe(
      map(usuario => {
        return { ...usuario, id: id } as Usuario;
      })
    );
  }

  async getUsuarioIdPromise(id: string): Promise<Usuario>{
    const usuarioRef = doc(this.firestore, 'usuarios', id);
    const snapshot = await getDoc(usuarioRef);
    const usuario = snapshot.data() as Usuario;
    usuario.id = snapshot.id;
    return usuario
  }
  
  async getUsuarioUser(usuario: string): Promise<Usuario | null>{
    const q = query(collection(this.firestore, 'usuarios'), where('usuario', '==', usuario));
    const querySnapshot = await getDocs(q);
    const doc = querySnapshot.docs[0];
    if (doc) {
      const usuario = doc.data() as Usuario;
      usuario['id'] = doc.id;
      return usuario
    }else{
      return null
    }
  }
  //-------------- VERIFICAR EXISTENTE -----
  
  async getTelefonoExistente(telefono: string){
    const queri = query(collection(this.firestore, 'usuarios'), where('telefono', '==', telefono));
    const querySnapshot = await getDocs(queri);
    const doc = querySnapshot.docs[0];
    if(doc){
      return true
    }else{
      return false
    }
  }

  async getNombreUsuarioExistente(usuario: string){
    const queri = query(collection(this.firestore, 'usuarios'), where('usuario', '==', usuario));
    const querySnapshot = await getDocs(queri);
    const doc = querySnapshot.docs[0];
    if(doc){
      return true
    }else{
      return false
    }
  }

  async getUserPhoneFromFirestore(uid: string | undefined): Promise<string | null> {
    if (!uid) {
      return null;
    }
    
    try {
      const userDoc = doc(this.firestore, 'usuarios', uid);
      const docSnapshot = await getDoc(userDoc);
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        return userData['telefono'] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo teléfono del usuario:', error);
      return null;
    }
  }

  get getUsuarios$(): Observable<Usuario[]>{
    const collectionUsuarios = collection(this.firestore, 'usuarios');
    return collectionData(collectionUsuarios, {idField: 'id'}) as Observable<Usuario[]>;
  }

  async getCorreoExistente(correo: string){
    const queri = query(collection(this.firestore, 'usuarios'), where('correo', '==', correo));
    const querySnapshot = await getDocs(queri);
    const doc = querySnapshot.docs[0];
    if(doc){
      return true
    }else{
      return false
    }
  }

  // --------------------------------------- AUTH ------------------------------------------- 

  async addUserFirestore(): Promise<void>{
    const usuario = this.obtenerUsuarioUnico();
    const usuarioRef = doc(this.firestore, "usuarios", this.auth.currentUser?.uid!);
    await setDoc(usuarioRef, usuario); 
    const nombre = usuario.nombre.split(' ')[0];
  }

  obtenerUsuarioUnico(): Usuario {
    const currentUser = this.auth.currentUser;
    const palabras = currentUser?.displayName?.trim().split(' ')!;
    const nombre = palabras.slice(0, 2).join(' ');
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1; // Los meses en JavaScript empiezan en 0
    const dia = fecha.getDate();
    const aleatorio = Math.floor(Math.random() * (999 - 1 + 1)) + 1;
    const usuario = `${nombre.toUpperCase()}${anio}${mes}${aleatorio}`;
    return {
      usuario: usuario.replace(/\s/g, ''),
      nombre: currentUser?.displayName!,
      correo: currentUser?.email!,
      seguidores: 0,
      registroHistorial: true,
      dinero: { disponible: 0, aLiberar: 0, },
      notificacionesRecibidas: { ofertasDecuentos: true, ventas: true, publicaciones: true, reclamos: true, mensajes: true},
      emailsRecibidos: { ofertas: true, mensajes: true, opiniones: true, ventas: true, publicacionesPorFinalizar: true, publicacionesFinalizadas: true, compras: true},
      fechaRegistro: new Date(),
      direcciones: [],
      notificaciones: [{
        foto: 'https://firebasestorage.googleapis.com/v0/b/enerfull-c3272.appspot.com/o/ilustraciones%2Fnuevo.png?alt=media&token=b4b33465-1e39-448d-8a5c-9e6bbb2f2a18',
        titulo: '¡Bienvenid@!',
        contenido: `Estamos emocionados de tenerte aquí ${nombre.split(' ')[0]}. Marca el comienzo de un emocionante viaje creativo. `,
        fecha: new Date(),
        tipo: 'ofertasDecuentos',
        link: 'vender',
        visto: false,
      }]
    } as Usuario;
  }

//--------------------------------------------------------------------------------------------------------------------------
  //Metodo SingUp en registro/secciones/codigo-sms

//------------------------------------------------------------------------------------------------------------------------------

  
  async singIn(email:string, password:string):Promise<string | void>{
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error:unknown) {
      const {code, message} = error as ErrorResponse;
      if(code === 'auth/user-not-found'){
        return 'emailError'
      } else if(code === 'auth/wrong-password'){
        return 'passwordError'
      }else if(code === 'auth/invalid-email'){
        return 'emailRequier'
      }else if(code === 'auth/missing-password'){
        return 'passwordRequier'
      }
    }
  }


//------------------------------------------------------------------------------------------------------------------------------------------------------


  async signOut(): Promise<void>{
    try{
      this.auth.signOut();
    }catch(error: unknown){
      console.error('Error al cerrar sesión:', error)
    }
  }
  
  async sendEmail(user:User): Promise<void>{
    try {
      await sendEmailVerification(user);
    } catch (error:unknown) {
      console.error('Error al enviar email de verificación:', error)
    }
  }
  //-------------------------------------------------------------------------------------------- GOOGLE --------------

  async singInGoogle(): Promise<void>{
    try{
      const result = await signInWithPopup(this.auth, this.googleProvider);
      
      if (result) {
        const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
        
        if (isNewUser) {
          await this.addUserFirestore();
          this.dataSharingService.setFormData({
            tipo: "singUpGoogle"
          });
          this.router.navigate(['cuenta/phone-validation']);
        } else {
          const docRef = doc(this.firestore, 'usuarios', result.user.uid);
          const docSnap = await getDoc(docRef);
          const usuario = docSnap.data();
          
          if(usuario && usuario['telefono']) {
            this.dataSharingService.setFormData({
              phone: usuario['telefono'],
              tipo: "singInGoogle"
            });
            this.router.navigate(['cuenta/phone-validation/enter-code']);
          } else {
            this.dataSharingService.setFormData({
              tipo: "singInGoogle"
            });
            this.router.navigate(['cuenta/phone-validation']);
          }
        }
      }
    }catch(error){
      console.error('Error en singInGoogle:', error)
    }
  }
}