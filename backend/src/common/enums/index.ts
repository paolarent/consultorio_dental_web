//ENUMS Q USO EN LA BD PARA CLASIFICACIONES O DATOS ESTATICOS

export enum ClasificacionACM {
  NINGUNA = "ninguna",
  ALERGIA = "alergia",
  CONDICION_MEDICA = "condicion_medica",
}

export enum FrecuenciaServicio {
  UNICA = "unica",
  DIARIA = "diaria",
  SEMANAL = "semanal",
  QUINCENAL = "quincenal",
  MENSUAL = "mensual",
  BIMESTRAL = "bimestral",
  TRIMESTRAL = "trimestral",
  SEMESTRAL = "semestral",
  ANUAL = "anual",
}

export enum ProveedorLogin {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum ReprogSolicitadaPor {
  PACIENTE = "paciente",
  DENTISTA = "dentista",
}

export enum Rol {
  PACIENTE = "paciente",
  DENTISTA = "dentista",
  ADMINISTRADOR = "admin",
}

export enum Severidad {
  ALTA = "alta",
  MEDIA = "media",
  BAJA = "baja",
}

export enum Sexo {
  FEMENINO = "femenino",
  MASCULINO = "masculino",
  OTRO = "otro",
}

export enum SiONo {
  SI = "si",
  NO = "no",
}

export enum Status {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
}

export enum StatusAlergia {
  ACTIVA = "activa",
  RESUELTA = "resuelta",
  DESCARTADA = "descartada",
}

export enum StatusArchivo {
  ACTIVO = "activo",
  OCULTO = "oculto",
}

export enum StatusCitaReprog {
  PROGRAMADA = "programada",
  CANCELADA = "cancelada",
}

export enum StatusCitas {
  PENDIENTE = "pendiente",
  PROGRAMADA = "programada",
  CANCELADA = "cancelada",
  COMPLETADA = "completada",
  REPROGRAMADA = "reprogramada",
}

export enum StatusCondicionMed {
  ACTIVA = "activa",
  RESUELTA = "resuelta",
  CRONICA = "cronica",
}

export enum StatusDetIngreso {
  ACTIVO = "activo",
  MODIFICADO = "modificado",
  ELIMINADO = "eliminado",
  REEMBOLSADO = "reembolsado",
}

export enum StatusEgreso {
  REGISTRADO = "registrado",
  ANULADO = "anulado",
  EDITADO = "editado",
  REEMBOLSADO = "reembolsado",
}

export enum StatusEvento {
  ACTIVO = "activo",
  FINALIZADO = "finalizado",
  CANCELADO = "cancelado",
  OCULTO = "oculto",
}

export enum StatusIngreso {
  PENDIENTE = "pendiente",
  PARCIAL = "parcial",
  PAGADO = "pagado",
  CANCELADO = "cancelado",
  REEMBOLSADO = "reembolsado",
}

export enum StatusPagIngreso {
  CONFIRMADO = "confirmado",
  PENDIENTE = "pendiente",
  CANCELADO = "cancelado",
  REEMBOLSADO = "reembolsado",
  RECHAZADO = "rechazado",
}

export enum TipoCobro {
  UNIDAD_ANATOMICA = "unidad_anatomica",
  PLAN_TERAPEUTICO = "plan_terapeutico",
}

export enum TipoPregunta {
  TEXTO = "texto",
  NUMERO = "numero",
  FECHA = "fecha",
  SELECCION_UNICA = "seleccion_unica",
  SELECCION_MULTIPLE = "seleccion_multiple",
  SI_NO = "si_no",
}