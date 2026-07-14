/* ============================================================
   ORACULUM — El Libro de los Destinos
   Corpus de datos.

   PROCEDENCIA (régimen de verdad):
   - Estructura y corpus: "Napoleon's Oraculum and Dream Book",
     Frank Tousey, Nueva York, 1884. Obra en DOMINIO PÚBLICO.
     Texto íntegro: archive.org/details/napoleonsoraculu00newy
   - Método verificado: 4 filas de rayas -> paridad -> símbolo de
     16 combinaciones -> tabla cabalística -> letra -> respuesta.
   - Traducción al castellano: propia (AFA), fiel al registro
     oracular del original. El texto inglés original se conserva
     junto a cada respuesta para trazabilidad.
   - Las 256 respuestas son las del libro. NINGUNA fue inventada.
   ============================================================ */

const LETRAS = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q'];

/* Las 16 preguntas canónicas (ed. 1884) */
const PREGUNTAS = [
  { n: 1,  es: '¿Obtendré lo que deseo?',                        en: 'Shall I obtain my wish?',                       grupo: 'Deseo y fortuna' },
  { n: 2,  es: '¿Tendré éxito en mis empresas?',                 en: 'Shall I have success in my undertakings?',      grupo: 'Deseo y fortuna' },
  { n: 3,  es: '¿Ganaré o perderé en mi causa?',                 en: 'Shall I gain or lose in my cause?',             grupo: 'Deseo y fortuna' },
  { n: 4,  es: '¿Habré de vivir en tierras extranjeras?',        en: 'Shall I have to live in foreign parts?',        grupo: 'Caminos y ausentes' },
  { n: 5,  es: '¿Regresará el ausente que está lejos?',          en: 'Will the stranger return from abroad?',         grupo: 'Caminos y ausentes' },
  { n: 6,  es: '¿Recuperaré lo que me fue robado?',              en: 'Shall I recover the property stolen?',          grupo: 'Bienes y personas' },
  { n: 7,  es: '¿Será leal mi amigo en sus tratos?',             en: 'Will my friend be true in his dealings?',       grupo: 'Bienes y personas' },
  { n: 8,  es: '¿Habré de viajar?',                              en: 'Shall I have to travel?',                       grupo: 'Caminos y ausentes' },
  { n: 9,  es: '¿Me ama y me estima esa persona?',               en: 'Does the person love and regard me?',           grupo: 'Amor y familia' },
  { n: 10, es: '¿Será próspero el matrimonio?',                  en: 'Will the marriage be prosperous?',              grupo: 'Amor y familia' },
  { n: 11, es: '¿Qué clase de esposa o esposo tendré?',          en: 'What sort of wife or husband shall I have?',    grupo: 'Amor y familia' },
  { n: 12, es: '¿Tendrá un hijo o una hija?',                    en: 'Will she have a son or a daughter?',            grupo: 'Amor y familia' },
  { n: 13, es: '¿Sanará el enfermo de su dolencia?',             en: 'Will the patient recover from his illness?',    grupo: 'Vida y destino' },
  { n: 14, es: '¿Será liberado el prisionero?',                  en: 'Will the prisoner be released?',                grupo: 'Vida y destino' },
  { n: 15, es: '¿Seré afortunado o desafortunado este día?',     en: 'Shall I be lucky or unlucky this day?',         grupo: 'Vida y destino' },
  { n: 16, es: '¿Qué significa mi sueño?',                       en: 'What does my dream signify?',                   grupo: 'Vida y destino' }
];

/* Días nefastos según la edición de 1884 (mes 1-12 -> días) */
const DIAS_NEFASTOS = {
  1:  [1, 2, 4, 6, 10, 20, 22],
  2:  [6, 17, 28],
  3:  [24, 26],
  4:  [10, 27, 28],
  5:  [7, 8],
  6:  [27],
  7:  [17, 21],
  8:  [20, 22],
  9:  [5, 30],
  10: [6],
  11: [3, 29],
  12: [6, 10, 15]
};

/* ------------------------------------------------------------
   TABLA CABALÍSTICA
   letra(pregunta q, símbolo s) = LETRAS[(q + s - 2) mod 16]
   (cuadrado latino cíclico del original)

   RESPUESTAS[letra][s-1] responde a la pregunta q = ((L - s) mod 16) + 1
   donde L es el índice 1..16 de la letra. Este invariante se verifica
   en tests/verify.js contra el orden del libro.
   ------------------------------------------------------------ */

const RESPUESTAS = {
  A: [
    { es: 'Lo que deseas lo obtendrás en breve.', en: 'What you wish for, you will shortly obtain.' },
    { es: 'Significa pesadumbre y dolor.', en: 'Signifies trouble and sorrow.' },
    { es: 'Sé muy cauto en lo que hagas este día, no sea que te alcance la desgracia.', en: 'Be very cautious what you do this day, lest trouble befall you.' },
    { es: 'El prisionero muere, y sus amigos lo lloran.', en: 'The prisoner dies, and is regretted by his friends.' },
    { es: 'La vida le será concedida esta vez, para que se prepare para la muerte.', en: 'Life will be spared this time, to prepare for death.' },
    { es: 'Una hija muy hermosa, pero de parto doloroso.', en: 'A very handsome daughter, but a painful one.' },
    { es: 'Tendrás por esposa o esposo a una persona virtuosa.', en: 'You will have a virtuous woman or man, for your wife or husband.' },
    { es: 'Si te casas con esa persona, tendrás enemigos donde menos los esperas.', en: 'If you marry this person, you will have enemies where you little expect.' },
    { es: 'Harás bien en declinar este amor: no es constante ni verdadero.', en: 'You had better decline this love, for it is neither constant nor true.' },
    { es: 'Declina tus viajes, pues no serán para tu provecho.', en: 'Decline your travels, for they will not be to your advantage.' },
    { es: 'Hay entre ambos una amistad verdadera y sincera.', en: 'There is a true and sincere friendship between you both.' },
    { es: 'No recuperarás lo que te fue robado.', en: 'You will not recover the stolen property.' },
    { es: 'El ausente volverá pronto, y con alegría.', en: 'The stranger will, with joy, soon return.' },
    { es: 'No te moverás del lugar donde ahora estás.', en: 'You will not remove from where you are at present.' },
    { es: 'La Providencia te sostendrá en una causa justa.', en: 'Providence will support you in a good cause.' },
    { es: 'No tienes suerte.', en: 'You are not lucky.' }
  ],
  B: [
    { es: 'La fortuna que te está destinada será codiciada por otros.', en: 'The luck that is ordained for you will be coveted by others.' },
    { es: 'Sean cuales sean tus deseos, declina de ellos por ahora.', en: 'Whatever your desires are, for the present decline them.' },
    { es: 'Anuncia un favor o una bondad de parte de alguien.', en: 'Signifies a favor or kindness from some person.' },
    { es: 'Hay enemigos que quisieran defraudarte y hacerte infeliz.', en: 'There are enemies who would defraud and render you unhappy.' },
    { es: 'Con gran dificultad obtendrá otra vez el perdón o la libertad.', en: 'With great difficulty he will obtain pardon or release again.' },
    { es: 'El enfermo debe prepararse para dejar este mundo.', en: 'The patient should be prepared to leave this world.' },
    { es: 'Tendrá un hijo, que será docto y sabio.', en: 'She will have a son, who will be learned and wise.' },
    { es: 'Una pareja rica te está destinada.', en: 'A rich partner is ordained for you.' },
    { es: 'De este matrimonio tendrás gran fortuna y prosperidad.', en: 'By this marriage you will have great luck and prosperity.' },
    { es: 'Este amor viene de un corazón recto y sincero.', en: 'This love comes from an upright and sincere heart.' },
    { es: 'Un Poder superior viajará contigo y te bendecirá.', en: 'A higher Power will surely travel with you, and bless you.' },
    { es: 'Guárdate de los amigos falsos y engañosos.', en: 'Beware of friends who are false and deceitful.' },
    { es: 'Recuperarás tus bienes, y de modo inesperado.', en: 'You will recover your property — unexpectedly.' },
    { es: 'El amor le impide, por ahora, volver a casa.', en: 'Love prevents his return home at present.' },
    { es: 'Tu morada no está aquí: prepárate para un cambio.', en: 'Your stay is not here; be therefore prepared for a change.' },
    { es: 'No habrá ganancia: sé por tanto prudente y cuidadoso.', en: 'You will have no gain; therefore be wise and careful.' }
  ],
  C: [
    { es: 'Con la bendición de Dios, tendrás gran ganancia.', en: 'With the blessing of God, you will have great gain.' },
    { es: 'Muy desafortunado, en verdad: pide auxilio.', en: 'Very unlucky indeed — pray for assistance.' },
    { es: 'Si tus deseos no son desmedidos, te serán concedidos.', en: 'If your desires are not extravagant, they will be granted.' },
    { es: 'Anuncia paz y abundancia entre amigos.', en: 'Signifies peace and plenty between friends.' },
    { es: 'Prepárate bien este día, o podrías toparte con la desgracia.', en: 'Be well prepared this day, or you may meet with trouble.' },
    { es: 'Al prisionero le será difícil obtener el perdón o la libertad.', en: 'The prisoner will find it difficult to obtain his pardon or release.' },
    { es: 'El enfermo gozará aún de salud y prosperidad.', en: 'The patient will yet enjoy health and prosperity.' },
    { es: 'Tendrá una hija, que requerirá cuidados.', en: 'She will have a daughter, and will require attention.' },
    { es: 'Esa persona no tiene gran fortuna, pero vive en holgura mediana.', en: 'The person has not a great fortune, but is in middling circumstances.' },
    { es: 'Declina este matrimonio, o de lo contrario te pesará.', en: 'Decline this marriage, or else you may be sorry.' },
    { es: 'Declina un cortejo que podría ser tu ruina.', en: 'Decline a courtship which may be your destruction.' },
    { es: 'Tus viajes serán en vano: mejor quédate en casa.', en: 'Your travels are in vain; you had better stay at home.' },
    { es: 'Puedes confiar en una amistad verdadera y sincera.', en: 'You may depend on a true and sincere friendship.' },
    { es: 'No esperes recobrar aquello que has perdido.', en: 'You must not expect to regain that which you have lost.' },
    { es: 'La enfermedad impide al viajero venir a verte.', en: 'Sickness prevents the traveler from seeing you.' },
    { es: 'Será tu destino permanecer donde ahora estás.', en: 'It will be your fate to stay where you now are.' }
  ],
  D: [
    { es: 'Obtendrás una gran fortuna en otro país.', en: 'You will obtain a great fortune in another country.' },
    { es: 'Aventurándote sin reservas, ganarás el doble con certeza.', en: 'By venturing freely, you will certainly gain doubly.' },
    { es: 'Un Poder superior tornará tu infortunio en éxito y felicidad.', en: 'A higher Power will change your misfortune into success and happiness.' },
    { es: 'Cambia tus intenciones, o podrías hallar pobreza y aflicción.', en: 'Alter your intentions, or else you may meet poverty and distress.' },
    { es: 'Anuncia que hallarás muchos impedimentos para lograr tus fines.', en: 'Signifies you have many impediments in accomplishing your pursuits.' },
    { es: 'Cualquiera sea tu inclinación este día, abandónala.', en: 'Whatever may possess your inclinations this day, abandon them.' },
    { es: 'El prisionero quedará libre esta vez.', en: 'The prisoner will get free again this time.' },
    { es: 'La dolencia del enfermo será larga y dudosa.', en: "The patient's illness will be lingering and doubtful." },
    { es: 'Tendrá un hijo obediente y hermoso.', en: 'She will have a dutiful and handsome son.' },
    { es: 'La persona será de condición humilde, pero de corazón honesto.', en: 'The person will be low in circumstances, but honest-hearted.' },
    { es: 'Un matrimonio que sumará a tu bienestar y prosperidad.', en: 'A marriage which will add to your welfare and prosperity.' },
    { es: 'Amas a una persona que no habla bien de ti.', en: 'You love a person who does not speak well of you.' },
    { es: 'Tus viajes serán prósperos, si los guía la prudencia.', en: 'Your travels will be prosperous, if guided by prudence.' },
    { es: 'No dice lo que piensa, porque su corazón es falso.', en: 'He means not what he says, for his heart is false.' },
    { es: 'Con algo de esfuerzo y gasto, podrás recuperar tus bienes.', en: 'With some trouble and expense, you may regain your property.' },
    { es: 'No esperes volver a ver al ausente.', en: 'You must not expect to see the stranger again.' }
  ],
  E: [
    { es: 'El ausente no volverá tan pronto como esperas.', en: 'The stranger will not return as soon as you expect.' },
    { es: 'Permanece entre los tuyos y te irá bien.', en: 'Remain among your friends, and you will do well.' },
    { es: 'Más adelante obtendrás aquello que buscas.', en: 'You will hereafter gain what you seek.' },
    { es: 'No tienes suerte: reza y esfuérzate con honradez.', en: 'You have no luck — pray, and strive honestly.' },
    { es: 'Obtendrás tus deseos por medio de un amigo.', en: 'You will obtain your wishes by means of a friend.' },
    { es: 'Anuncia que tienes enemigos que intentarán arruinarte.', en: 'Signifies you have enemies who will endeavor to ruin you.' },
    { es: 'Cuidado: un enemigo trata de arrastrarte a la disputa y al infortunio.', en: 'Beware — an enemy is endeavoring to bring you to strife and misfortune.' },
    { es: 'Grandes son la pena y la angustia del prisionero, y su libertad es incierta.', en: "The prisoner's sorrow and anxiety are great, and his release uncertain." },
    { es: 'El enfermo sanará pronto: no hay peligro.', en: 'The patient will soon recover — there is no danger.' },
    { es: 'Tendrá una hija, que será honrada y respetada.', en: 'She will have a daughter, who will be honored and respected.' },
    { es: 'Tu pareja será aficionada al licor, y por él se degradará.', en: 'Your partner will be fond of liquor, and will debase himself thereby.' },
    { es: 'Este matrimonio te llevará a la pobreza: sé, pues, discreto.', en: 'This marriage will bring you to poverty, be therefore discreet.' },
    { es: 'Su amor es falso contigo, y verdadero con otros.', en: 'Their love is false to you, and true to others.' },
    { es: 'Declina tus viajes por ahora, pues serán peligrosos.', en: 'Decline your travels for the present, for they will be dangerous.' },
    { es: 'Esa persona es seria y veraz, y merece respeto.', en: 'This person is serious and true, and deserves to be respected.' },
    { es: 'No recuperarás los bienes que has perdido.', en: 'You will not recover the property you have lost.' }
  ],
  F: [
    { es: 'Perseverando, recuperarás tus bienes.', en: 'By persevering you will recover your property again.' },
    { es: 'No está en poder del ausente regresar.', en: "It is out of the stranger's power to return." },
    { es: 'Ganarás y prosperarás en tierras extranjeras.', en: 'You will gain, and be successful in foreign parts.' },
    { es: 'Una gran fortuna te está destinada: espera con paciencia.', en: 'A great fortune is ordained for you; wait patiently.' },
    { es: 'Hay un gran obstáculo a tu éxito por el momento.', en: 'There is great hindrance to your success at present.' },
    { es: 'Tus deseos son vanos por ahora.', en: 'Your wishes are in vain at present.' },
    { es: 'Anuncia que hay pena y peligro ante ti.', en: 'Signifies there are sorrow and danger before you.' },
    { es: 'Este día es aciago: cambia, por tanto, tu propósito.', en: 'This day is unlucky; therefore alter your intention.' },
    { es: 'El prisionero será devuelto a la libertad.', en: 'The prisoner will be restored to liberty and freedom.' },
    { es: 'La recuperación del enfermo es dudosa.', en: "The patient's recovery is doubtful." },
    { es: 'Tendrá un hermoso varón.', en: 'She will have a fine boy.' },
    { es: 'Una persona digna, y una buena fortuna.', en: 'A worthy person, and a fine fortune.' },
    { es: 'Tus intenciones destruirían tu descanso y tu paz.', en: 'Your intentions would destroy your rest and peace.' },
    { es: 'Este amor es verdadero y constante: no lo abandones.', en: 'This love is true and constant; forsake it not.' },
    { es: 'Emprende tu viaje: no tendrás motivo para arrepentirte.', en: 'Proceed on your journey, and you will not have cause to repent it.' },
    { es: 'Si confías en este amigo, podrías tener motivo de pesar.', en: 'If you trust this friend, you may have cause for sorrow.' }
  ],
  G: [
    { es: 'Este amigo supera a todos los demás en todo respecto.', en: 'This friend exceeds all others in every respect.' },
    { es: 'Debes sobrellevar tu pérdida con entereza.', en: 'You must bear your loss with fortitude.' },
    { es: 'El ausente regresará de improviso.', en: 'The stranger will return unexpectedly.' },
    { es: 'Permanece en casa con los tuyos y escaparás de la desgracia.', en: 'Remain at home with your friends, and you will escape misfortunes.' },
    { es: 'No hallarás ganancia alguna en tus empeños.', en: 'You will meet no gain in your pursuits.' },
    { es: 'El Cielo derramará sus bendiciones sobre ti.', en: 'Heaven will bestow its blessings on you.' },
    { es: 'No.', en: 'No.' },
    { es: 'Anuncia que pronto quedarás fuera del poder de tus enemigos.', en: 'Signifies that you will shortly be out of the power of your enemies.' },
    { es: 'La mala suerte te aguarda: te será difícil escapar de ella.', en: 'Ill-luck awaits you — it will be difficult for you to escape it.' },
    { es: 'El prisionero solo será liberado por la muerte.', en: 'The prisoner will be released by death only.' },
    { es: 'Por la bendición de Dios, el enfermo sanará.', en: 'By the blessing of God, the patient will recover.' },
    { es: 'Una hija, pero de constitución muy enfermiza.', en: 'A daughter, but of a very sickly constitution.' },
    { es: 'Tendrás una pareja honesta, joven y hermosa.', en: 'You will get an honest, young, and handsome partner.' },
    { es: 'Declina este matrimonio, o podría ser para tu pesar.', en: 'Decline this marriage, else it may be to your sorrow.' },
    { es: 'Evita este amor.', en: 'Avoid this love.' },
    { es: 'Prepárate para un viaje corto: sucesos imprevistos te harán volver.', en: 'Prepare for a short journey; you will be recalled by unexpected events.' }
  ],
  H: [
    { es: 'Emprende tus viajes: irán como los deseas.', en: 'Commence your travels, and they will go on as you could wish.' },
    { es: 'Tu supuesto amigo te odia en secreto.', en: 'Your pretended friend hates you secretly.' },
    { es: 'Es vana tu esperanza de recuperar tus bienes.', en: 'Your hopes to recover your property are vain.' },
    { es: 'Cierto asunto impide el regreso inmediato del ausente.', en: "A certain affair prevents the stranger's return immediately." },
    { es: 'Hallarás tu fortuna en abundancia en el extranjero.', en: 'Your fortune you will find in abundance abroad.' },
    { es: 'Declina el empeño, y te irá bien.', en: 'Decline the pursuit, and you will do well.' },
    { es: 'Tus expectativas son vanas: no tendrás éxito.', en: 'Your expectations are vain — you will not succeed.' },
    { es: 'Obtendrás aquello que deseas.', en: 'You will obtain what you wish for.' },
    { es: 'Anuncia que en este día tu fortuna cambiará para mejor.', en: 'Signifies that on this day your fortune will change for the better.' },
    { es: 'Levanta el ánimo: tu suerte está cerca.', en: 'Cheer up your spirits, your luck is at hand.' },
    { es: 'Tras largo cautiverio, será liberado.', en: 'After long imprisonment, he will be released.' },
    { es: 'El enfermo será aliviado de su mal.', en: 'The patient will be relieved from sickness.' },
    { es: 'Tendrá un hijo sano.', en: 'She will have a healthy son.' },
    { es: 'En breve te casarás con tu igual.', en: 'You will be married to your equal in a short time.' },
    { es: 'Si quieres ser feliz, no te cases con esta persona.', en: 'If you wish to be happy, do not marry this person.' },
    { es: 'Este amor nace del corazón, y durará hasta la muerte.', en: 'This love is from the heart, and will continue until death.' }
  ],
  I: [
    { es: 'El amor es grande, pero causará grandes celos.', en: 'The love is great, but will cause great jealousy.' },
    { es: 'Será en vano que viajes.', en: 'It will be in vain for you to travel.' },
    { es: 'Tu amigo será tan sincero como podrías desear.', en: 'Your friend will be as sincere as you could wish him to be.' },
    { es: 'Recuperarás lo robado por medio de una persona astuta.', en: 'You will recover the stolen property through a cunning person.' },
    { es: 'El viajero volverá pronto, y con alegría.', en: 'The traveler will soon return with joy.' },
    { es: 'No serás próspero ni afortunado en tierras extranjeras.', en: 'You will not be prosperous or fortunate in foreign parts.' },
    { es: 'Pon tu confianza en Dios, que dispone de la dicha.', en: 'Place your trust in God, who is the disposer of happiness.' },
    { es: 'Tu fortuna se tornará pronto en infortunio.', en: 'Your fortune will shortly be changed into misfortune.' },
    { es: 'Tendrás éxito, tal como lo deseas.', en: 'You will succeed as you desire.' },
    { es: 'Anuncia que la desgracia que amenaza será evitada.', en: 'Signifies that the misfortune which threatens will be prevented.' },
    { es: 'Guárdate de tus enemigos, que buscan hacerte daño.', en: 'Beware of your enemies, who seek to do you harm.' },
    { es: 'Al poco tiempo cesará tu inquietud por el prisionero.', en: 'After a short time, your anxiety for the prisoner will cease.' },
    { es: 'Dios devolverá al enfermo la salud y la fuerza.', en: 'God will give the patient health and strength again.' },
    { es: 'Tendrá una hija muy hermosa.', en: 'She will have a very fine daughter.' },
    { es: 'Te casarás con una persona con la que tendrás poco sosiego.', en: 'You will marry a person with whom you will have little comfort.' },
    { es: 'El matrimonio no responderá a tus expectativas.', en: 'The marriage will not answer your expectations.' }
  ],
  K: [
    { es: 'Tras mucho infortunio, vivirás con holgura y felicidad.', en: 'After much misfortune, you will be comfortable and happy.' },
    { es: 'Un amor sincero, de un corazón recto.', en: 'A sincere love from an upright heart.' },
    { es: 'Serás próspero en tu viaje.', en: 'You will be prosperous in your journey.' },
    { es: 'No te fíes de la amistad de esa persona.', en: 'Do not rely on the friendship of this person.' },
    { es: 'Los bienes están perdidos para siempre; pero el ladrón será castigado.', en: 'The property is lost for ever; but the thief will be punished.' },
    { es: 'El viajero estará ausente por un tiempo considerable.', en: 'The traveler will be absent some considerable time.' },
    { es: 'Hallarás fortuna y dicha en un país extranjero.', en: 'You will meet luck and happiness in a foreign country.' },
    { es: 'No tendrás éxito alguno por el momento.', en: 'You will not have any success for the present.' },
    { es: 'Tendrás éxito en tu empresa.', en: 'You will succeed in your undertaking.' },
    { es: 'Cambia tus intenciones, y te irá bien.', en: 'Change your intentions, and you will do well.' },
    { es: 'Anuncia que hay bribones cerca de ti.', en: 'Signifies that there are rogues at hand.' },
    { es: 'Reconcíliate: tu situación mejorará en breve.', en: 'Be reconciled, your circumstances will shortly mend.' },
    { es: 'El prisionero será liberado.', en: 'The prisoner will be released.' },
    { es: 'El enfermo partirá de esta vida.', en: 'The patient will depart this life.' },
    { es: 'Tendrá un hijo.', en: 'She will have a son.' },
    { es: 'Te será difícil hallar pareja.', en: 'It will be difficult for you to get a partner.' }
  ],
  L: [
    { es: 'Tendrás por pareja a una persona muy hermosa.', en: 'You will get a very handsome person for your partner.' },
    { es: 'Diversos infortunios acompañarán a este matrimonio.', en: 'Various misfortunes will attend this marriage.' },
    { es: 'Este amor es caprichoso y mudable.', en: 'This love is whimsical and changeable.' },
    { es: 'Serás desafortunado en tus viajes.', en: 'You will be unlucky in your travels.' },
    { es: 'El amor de esa persona es justo y verdadero. Puedes fiarte de él.', en: "This person's love is just and true. You may rely on it." },
    { es: 'Perderás, pero el ladrón sufrirá más que tú.', en: 'You will lose, but the thief will suffer most.' },
    { es: 'El ausente volverá pronto, y con abundancia.', en: 'The stranger will soon return with plenty.' },
    { es: 'Si permaneces en casa, tendrás éxito.', en: 'If you remain at home, you will have success.' },
    { es: 'Tu ganancia será insignificante.', en: 'Your gain will be trivial.' },
    { es: 'Hallarás pena y aflicción.', en: 'You will meet sorrow and trouble.' },
    { es: 'Tendrás éxito conforme a tus deseos.', en: 'You will succeed according to your wishes.' },
    { es: 'Anuncia que recibirás dinero.', en: 'Signifies that you will get money.' },
    { es: 'A pesar de tus enemigos, te irá bien.', en: 'In spite of enemies, you will do well.' },
    { es: 'El prisionero pasará aún muchos días en cautiverio.', en: 'The prisoner will pass many days in confinement.' },
    { es: 'El enfermo sanará.', en: 'The patient will recover.' },
    { es: 'Tendrá una hija.', en: 'She will have a daughter.' }
  ],
  M: [
    { es: 'Tendrá un hijo, que alcanzará riqueza y honor.', en: 'She will have a son, who will gain wealth and honor.' },
    { es: 'Tendrás una pareja de grandes empresas y mucho dinero.', en: 'You will get a partner with great undertakings and much money.' },
    { es: 'El matrimonio será próspero.', en: 'The marriage will be prosperous.' },
    { es: 'Ella, o él, desea ser tuyo en este mismo instante.', en: 'She, or He, wishes to be yours this moment.' },
    { es: 'Tu viaje resultará en tu provecho.', en: 'Your journey will prove to your advantage.' },
    { es: 'No deposites gran confianza en esa persona.', en: 'Place no great trust in that person.' },
    { es: 'Hallarás tus bienes en su debido momento.', en: 'You will find your property at a certain time.' },
    { es: 'Su propia conducta vuelve dudoso el regreso del viajero.', en: "The traveler's return is rendered doubtful by his conduct." },
    { es: 'Tendrás éxito, tal como lo deseas, en tierras extranjeras.', en: 'You will succeed as you desire in foreign parts.' },
    { es: 'No esperes ganancia: será en vano.', en: 'Expect no gain; it will be in vain.' },
    { es: 'Tendrás más suerte de la que esperas.', en: 'You will have more luck than you expect.' },
    { es: 'Sean cuales sean tus deseos, los obtendrás pronto.', en: 'Whatever your desires are, you will speedily obtain them.' },
    { es: 'Anuncia que serás invitado a una boda.', en: 'Signifies you will be asked to a wedding.' },
    { es: 'No tendrás motivo para quejarte de la mala suerte.', en: 'You will have no occasion to complain of ill-luck.' },
    { es: 'Alguien se apiadará del prisionero y lo liberará.', en: 'Some one will pity and release the prisoner.' },
    { es: 'La recuperación del enfermo es improbable.', en: "The patient's recovery is unlikely." }
  ],
  N: [
    { es: 'El enfermo sanará, pero sus días serán breves.', en: 'The patient will recover, but his days are short.' },
    { es: 'Tendrá una hija.', en: 'She will have a daughter.' },
    { es: 'Te casarás con una familia muy respetable.', en: 'You will marry into a very respectable family.' },
    { es: 'De este matrimonio no obtendrás nada.', en: 'By this marriage you will gain nothing.' },
    { es: 'Espera el momento y hallarás que el amor es grande.', en: 'Await the time and you will find the love great.' },
    { es: 'No te aventures lejos de casa.', en: 'Venture not from home.' },
    { es: 'Esa persona es un amigo sincero.', en: 'This person is a sincere friend.' },
    { es: 'Nunca recuperarás lo robado.', en: 'You will never recover the theft.' },
    { es: 'El ausente volverá, pero no pronto.', en: 'The stranger will return, but not quickly.' },
    { es: 'Estando fuera, apártate de las malas compañías, o te harán daño.', en: 'When abroad, keep from evil company or they will do you harm.' },
    { es: 'Pronto ganarás aquello que menos esperas.', en: 'You will soon gain what you little expect.' },
    { es: 'Tendrás gran éxito.', en: 'You will have great success.' },
    { es: 'Regocíjate siempre en aquello que te está destinado.', en: 'Rejoice ever at that which is ordained for you.' },
    { es: 'Anuncia que la pena se irá, y la alegría volverá.', en: 'Signifies that sorrow will depart, and joy will return.' },
    { es: 'Tu suerte está en flor: pronto estará al alcance de tu mano.', en: 'Your luck is in blossom; it will soon be at hand.' },
    { es: 'La muerte puede poner fin al cautiverio.', en: 'Death may end the imprisonment.' }
  ],
  O: [
    { es: 'El prisionero será liberado con alegría.', en: 'The prisoner will be released with joy.' },
    { es: 'La recuperación del enfermo es dudosa.', en: "The patient's recovery is doubtful." },
    { es: 'Tendrá un hijo, que vivirá hasta edad muy avanzada.', en: 'She will have a son, who will live to a great age.' },
    { es: 'Tendrás una pareja virtuosa.', en: 'You will get a virtuous partner.' },
    { es: 'No demores este matrimonio: hallarás en él mucha dicha.', en: 'Delay not this marriage — you will meet much happiness.' },
    { es: 'Nadie te ama más en este mundo.', en: 'None loves you better in this world.' },
    { es: 'Puedes proceder con confianza.', en: 'You may proceed with confidence.' },
    { es: 'No es un amigo, sino un enemigo secreto.', en: 'Not a friend, but a secret enemy.' },
    { es: 'Pronto recuperarás lo que te fue robado.', en: 'You will soon recover what is stolen.' },
    { es: 'El ausente no volverá jamás.', en: 'The stranger will not return again.' },
    { es: 'Una persona extranjera acrecentará mucho tu fortuna.', en: 'A foreign woman will greatly enhance your fortune.' },
    { es: 'Serás despojado de tu ganancia.', en: 'You will be cheated out of your gain.' },
    { es: 'Tus infortunios se desvanecerán y serás feliz.', en: 'Your misfortunes will vanish and you will be happy.' },
    { es: 'Tu esperanza es vana: la fortuna te rehúye por ahora.', en: 'Your hope is in vain — fortune shuns you at present.' },
    { es: 'Que pronto oirás noticias gratas.', en: 'That you will soon hear agreeable news.' },
    { es: 'Hay infortunios acechando a tu alrededor.', en: 'There are misfortunes lurking about you.' }
  ],
  P: [
    { es: 'Este día te trae un acrecentamiento de la dicha.', en: 'This day brings you an increase of happiness.' },
    { es: 'El prisionero se librará del poder de sus enemigos.', en: 'The prisoner will quit the power of his enemies.' },
    { es: 'El enfermo sanará y vivirá largamente.', en: 'The patient will recover and live long.' },
    { es: 'Tendrá dos hijas.', en: 'She will have two daughters.' },
    { es: 'Una persona joven y rica será tu pareja.', en: 'A rich young person will be your partner.' },
    { es: 'Apresura tu matrimonio: te traerá mucha felicidad.', en: 'Hasten your marriage — it will bring you much happiness.' },
    { es: 'Esa persona te ama sinceramente.', en: 'The person loves you sincerely.' },
    { es: 'No prosperarás lejos de casa.', en: 'You will not prosper from home.' },
    { es: 'Este amigo vale más que el oro.', en: 'This friend is more valuable than gold.' },
    { es: 'Nunca recibirás tus bienes.', en: 'You will never receive your goods.' },
    { es: 'Está gravemente enfermo, y aún no puede regresar.', en: 'He is dangerously ill, and cannot yet return.' },
    { es: 'Confía en tu propia laboriosidad, y quédate en casa.', en: 'Depend upon your own industry, and remain at home.' },
    { es: 'Alégrate: la prosperidad futura te está destinada.', en: 'Be joyful, for future prosperity is ordained for you.' },
    { es: 'No confíes demasiado en tu buena suerte.', en: 'Depend not too much on your good luck.' },
    { es: 'Lo que deseas te será concedido.', en: 'What you wish will be granted to you.' },
    { es: 'Que has de ser muy cuidadoso este día, no sea que te ocurra algún accidente.', en: 'That you should be very careful this day, lest any accident befall you.' }
  ],
  Q: [
    { es: 'Anuncia mucha alegría y dicha entre amigos.', en: 'Signifies much joy and happiness between friends.' },
    { es: 'Este día no es muy afortunado, sino más bien lo contrario.', en: 'This day is not very lucky, but rather the reverse.' },
    { es: 'Alcanzará aún el honor, aunque ahora padezca.', en: 'He will yet come to honor, although he now suffers.' },
    { es: 'La recuperación es dudosa: prepárate, pues, para lo peor.', en: 'Recovery is doubtful; therefore be prepared for the worst.' },
    { es: 'Tendrá un hijo que resultará atrevido.', en: 'She will have a son who will prove forward.' },
    { es: 'Una pareja rica, pero de mal carácter.', en: 'A rich partner, but a bad temper.' },
    { es: 'Casándote con esta persona aseguras tu felicidad.', en: 'By wedding this person you insure your happiness.' },
    { es: 'Esa persona te ama mucho, pero desea ocultarlo.', en: 'The person has great love for you, but wishes to conceal it.' },
    { es: 'Puedes emprender tu viaje sin temor.', en: 'You may proceed on your journey without fear.' },
    { es: 'No confíes en él: es inconstante y engañoso.', en: 'Trust him not; he is inconstant and deceitful.' },
    { es: 'De un modo muy singular recuperarás tus bienes.', en: 'In a very singular manner you will recover your property.' },
    { es: 'El ausente volverá muy pronto.', en: 'The stranger will return very soon.' },
    { es: 'Vivirás en el extranjero con holgura y felicidad.', en: 'You will dwell abroad in comfort and happiness.' },
    { es: 'Si obras con rectitud, ciertamente prosperarás.', en: 'If you will deal fairly you will surely prosper.' },
    { es: 'Vivirás aún en esplendor y abundancia.', en: 'You will yet live in splendor and plenty.' },
    { es: 'Conténtate con la fortuna que ahora tienes.', en: 'Make yourself contented with your present fortune.' }
  ]
};

/* ------------------------------------------------------------
   Motor del oráculo
   ------------------------------------------------------------ */

/* Reducción del original: si las rayas superan 9, se cuenta solo
   el excedente sobre ese número. Aplicado repetidamente para
   conteos > 18 (SUPUESTO declarado: el libro solo ejemplifica 10-18). */
function reducir(n) {
  while (n > 9) n -= 9;
  return n;
}

/* Paridad -> 1 punto (impar) o 2 puntos (par) */
function puntos(n) {
  return reducir(n) % 2 === 1 ? 1 : 2;
}

/* Las 4 filas de puntos -> índice de símbolo 0..15
   Fila 1 es el bit más significativo. 1 punto = 0, 2 puntos = 1. */
function indiceSimbolo(filasPuntos) {
  return filasPuntos.reduce((acc, p) => acc * 2 + (p - 1), 0);
}

/* Los 16 símbolos, en el orden de las columnas de la tabla */
const SIMBOLOS = Array.from({ length: 16 }, (_, i) => [
  ((i >> 3) & 1) + 1,
  ((i >> 2) & 1) + 1,
  ((i >> 1) & 1) + 1,
  (i & 1) + 1
]);

/* Tabla cabalística: letra para (pregunta 1..16, símbolo 1..16) */
function letraDe(q, s) {
  return LETRAS[(q + s - 2) % 16];
}

/* Respuesta final */
function consultar(q, s) {
  const letra = letraDe(q, s);
  return {
    pregunta: PREGUNTAS[q - 1],
    letra,
    simbolo: SIMBOLOS[s - 1],
    indiceSimbolo: s,
    respuesta: RESPUESTAS[letra][s - 1]
  };
}

/* ¿Es hoy un día nefasto según el libro? */
function esDiaNefasto(fecha) {
  const dias = DIAS_NEFASTOS[fecha.getMonth() + 1] || [];
  return dias.includes(fecha.getDate());
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LETRAS, PREGUNTAS, RESPUESTAS, DIAS_NEFASTOS, SIMBOLOS,
    reducir, puntos, indiceSimbolo, letraDe, consultar, esDiaNefasto
  };
}
