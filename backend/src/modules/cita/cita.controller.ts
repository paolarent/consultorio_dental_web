import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CitaService } from './cita.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CrearCitaDto } from './dto/create-cita.dto';
import { ActualizarStatusCitaDto } from './dto/act-status-cita.dto';
import { SolicitarCitaDto } from './dto/solicitar-cita.dto';
import { Rol, StatusCitas } from 'src/common/enums';
import { ConsultarDisponibilidadDto } from './dto/consultar-disp.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { ResponderReprogramacionDto } from './dto/resp-reprog-cita.dto';

@Controller('cita')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitaController {
    constructor ( private readonly citaService: CitaService ) {}

    @Get('motivos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE)
    listarMotivos(@Req() req) {
        const id_consultorio = req.user.id_consultorio;
        return this.citaService.listarMotivos(id_consultorio);
    }

    //----------------------------------ENDPOINTS DENTISTA----------------------------------------------------------------
    //Crear cita directamente (solo dentista)
    @Post('crear')
    @Roles(Rol.DENTISTA)
    async crearCita(@Body() dto: CrearCitaDto, @Req() req: any) {
        const id_consultorio = req.user.id_consultorio;
        return this.citaService.crearCita(dto, id_consultorio);
    }

    
    //Obtener reprogramaciones pendientes de respuesta
    @Get('reprogramaciones-pendientes')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async obtenerReprogramacionesPendientes(@Req() req: any) {
        return this.citaService.obtenerReprogramacionesPendientes(
            req.user.id_usuario,
            req.user.rol,
            req.user.id_consultorio
        );
    }

    //Obtener citas del día actual o de una fecha específica
    @Get('dentista/citas-del-dia')
    @Roles(Rol.DENTISTA)
    async obtenerCitasDelDia(
        @Query('fecha') fecha?: string,
        @Req() req?: any
    ) {
        return this.citaService.obtenerCitasDelDia(req.user.id_usuario, fecha);
    }


    //Obtener todas las solicitudes de citas pendientes de confirmación
    @Get('dentista/citas-pendientes')
    @Roles(Rol.DENTISTA)
    async obtenerCitasPendientes(@Req() req: any) {
        return this.citaService.obtenerCitasPendientes(req.user.id_consultorio);
    }

    //Obtener estadísticas de citas del consultorio
    @Get('dentista/estadisticas')
    @Roles(Rol.DENTISTA)
    async obtenerEstadisticas(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Req() req?: any
    ) {
        return this.citaService.obtenerEstadisticas(
            req.user.id_usuario,
            fechaInicio,
            fechaFin
        );
    }

    //Obtener horarios ocupados de un día específico
    @Get('dentista/horarios-ocupados')
    @Roles(Rol.DENTISTA)
    async obtenerHorariosOcupados(
        @Query('fecha') fecha: string,
        @Req() req: any
    ) {
        if (!fecha) {
            throw new BadRequestException('La fecha es requerida');
        }
        return this.citaService.obtenerHorariosOcupados(fecha, req.user.id_consultorio);
    }

    //----------------------ENDPOINTS PACIENTE---------------------------------------------------------------------------------
    @Post('solicitar')
    @Roles(Rol.PACIENTE)
    async solicitarCita(@Body() dto: SolicitarCitaDto, @Req() req: any) {
        const usuarioAuth = req.user; // { id_usuario, rol, id_consultorio }
        return this.citaService.solicitarCita(dto, usuarioAuth.id_usuario, usuarioAuth.id_consultorio);
    }


    //Listar citas del paciente
    @Get('paciente/mis-citas')
    @Roles(Rol.PACIENTE)
    async listarCitasPaciente(
        @Query('status') status?: string,
        @Req() req?: any
    ) {
        return this.citaService.listarCitas({
            idUsuario: req.user.id_usuario,
            rol: Rol.PACIENTE,
            status: status as any
        });
    }

    //Listar citas del dentista con filtros opcionales
    @Get('dentista/mis-citas')
    @Roles(Rol.DENTISTA,)
    async listarCitasDentista(
        @Query('fecha') fecha?: string,
        @Query('status') status?: string,
        @Req() req?: any
    ) {
        return this.citaService.listarCitas({
            idUsuario: req.user.id_usuario,
            rol: Rol.DENTISTA,
            fecha,
            status: status as any
        });
    }

    @Get('calendario/citas')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async listarCitasCalendario(@Req() req?: any) {
        const idUsuario = req.user.id_usuario;
        const rol = req.user.rol as 'dentista' | 'paciente';
        return this.citaService.listarCitas({
            idUsuario,
            rol,
            status: StatusCitas.PROGRAMADA // Podrías opcionalmente filtrar por fecha
        });
    }


    //Consultar horarios disponibles para agendar (paciente)
    @Post('disponibilidad')
    @Roles(Rol.PACIENTE)
    async consultarDisponibilidad(
        @Body() dto: ConsultarDisponibilidadDto,
        @Req() req: any
    ) {
        const id_consultorio = req.user.id_consultorio;
        return this.citaService.consultarDisponibilidad(dto, id_consultorio);
    }

    //Obtener próximas citas programadas del paciente
    @Get('paciente/proximas-citas')
    @Roles(Rol.PACIENTE)
    async obtenerProximasCitas(
        @Query('limite', new ParseIntPipe({ optional: true })) limite: number = 5,
        @Req() req: any
    ) {
        return this.citaService.obtenerProximasCitas(req.user.id_usuario, limite);
    }

    
    //Obtener historial de citas completadas/canceladas
    @Get('paciente/historial')
    @Roles(Rol.PACIENTE)
    async obtenerHistorialCitas(
        @Query('pagina', new ParseIntPipe({ optional: true })) pagina: number = 1,
        @Query('limite', new ParseIntPipe({ optional: true })) limite: number = 10,
        @Req() req: any
    ) {
        return this.citaService.obtenerHistorialCitas(
            req.user.id_usuario,
            pagina,
            limite
        );
    }

    //Solicitar reprogramación de cita 
    @Post('reprogramar')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async solicitarReprogramacion(
        @Body() dto: ReprogramarCitaDto,
        @Req() req: any
    ) {
        const usuarioAuth = req.user; 
        return this.citaService.solicitarReprogramacion(dto, usuarioAuth.id_usuario, usuarioAuth.rol, usuarioAuth.id_consultorio);
    }

    //Verificar si hay conflictos de horario
    @Post('verificar-conflictos')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async verificarConflictos(
        @Body() body: { fecha: string; horaInicio: string; idCitaExcluir?: number },
        @Req() req: any
    ) {
        this.validarFechaFutura(body.fecha, body.horaInicio);
        return this.citaService.verificarConflictos(
            body.fecha,
            body.horaInicio,
            req.user.id_consultorio,
            body.idCitaExcluir
        );
    }

    //Confirmar(programar) o rechazar cita pendiente (solo dentista)
    @Patch(':id/actualizar-status')
    @Roles(Rol.DENTISTA)
    async actualizarStatusCita(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ActualizarStatusCitaDto,
        @Req() req: any
    ) {
        return this.citaService.actualizarStatusCita(id, dto, req.user.id_usuario, req.user.id_consultorio);
    }

    //Marcar una cita como completada
    @Patch(':id/completar')
    @Roles(Rol.DENTISTA)
    async marcarCitaCompletada(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any
    ) {
        return this.citaService.marcarCitaCompletada(id, req.user.id_usuario);
    }


    //-------------------------------------------ENDPOINTS COMPARTIDOS (AMBOS ROLES)
    
    //Obtener detalle de una cita específica 
    @Get(':id')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async obtenerCita(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any
    ) {
        return this.citaService.obtenerCitaPorId(id, req.user.id_usuario, req.user.rol);
    }

    //Cancelar cita
    @Patch(':id/cancelar')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async cancelarCita(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any
    ) {
        const usuarioAuth = req.user; 
        return this.citaService.cancelarCita( id, usuarioAuth.id_usuario, usuarioAuth.rol );
    }

    //Aceptar o rechazar reprogramación (rol contrario al solicitante)
    @Patch('reprogramacion/:id/responder')
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async responderReprogramacion(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ResponderReprogramacionDto,
        @Req() req: any
    ) {
        const usuarioAuth = req.user; 
        return this.citaService.responderReprogramacion(id, dto, usuarioAuth.id_usuario, usuarioAuth.rol);
    }

    
    //Valida que la fecha y hora sean futuras
    private validarFechaFutura(fecha: string, hora: string) {
        const fechaHora = new Date(`${fecha}T${hora}`);
        const ahora = new Date();

        if (fechaHora <= ahora) {
            throw new BadRequestException(
                'No puedes crear/solicitar citas en fechas u horas pasadas'
            );
        }
    }
}
