import { Controller, Get, Post, Body, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { IngresoService } from './ingreso.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { FilterIngresosDto } from './dto/filtro-ingreso.dto';
import { AbonarIngresoDto } from './dto/abonar-ingreso.dto';
import { CreateCorteDto } from './dto/create-corte-caja.dto';
import { CloseCorteDto } from './dto/close-corte-caja.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';


@Controller('ingresos')
export class IngresoController {
    constructor(private readonly ingresoService: IngresoService) {}

    @Get('formas-de-pago')
    //@Public()
    listarTipos() {
        return this.ingresoService.listarFormasPago();
    }

    // ---------------------------------------------------------
    // CREATE INGRESO COMPLETO
    // ---------------------------------------------------------
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    create(@Body() dto: CreateIngresoDto, @Req() req) {
        return this.ingresoService.create(
            dto,
            req.user.id_consultorio,   // aquí jalamos id_consultorio
        );
    }

    // ---------------------------------------------------------
    // FILTRAR INGRESOS
    // ---------------------------------------------------------
    /*@Get()
    findAll(@Query() filtro: FilterIngresosDto) {
        return this.ingresoService.findAll(filtro);
    }*/
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    findAll(@Req() req) {
        return this.ingresoService.findAll(req.user.id_consultorio);
    }

    // ---------------------------------------------------------
    // OBTENER UN INGRESO
    // ---------------------------------------------------------
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    findOne(@Param('id') id: number, @Req() req) {
        return this.ingresoService.findOne(+id, req.user.id_consultorio);
    }

    // ---------------------------------------------------------
    // ACTUALIZAR INGRESO (solo notas, paciente, consultorio)
    // ---------------------------------------------------------
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    update(@Param('id') id: number, @Body() dto: UpdateIngresoDto, @Req() req) {
        return this.ingresoService.update(+id, dto, req.user.id_consultorio);
    }

    // ---------------------------------------------------------
    // CANCELAR INGRESO
    // ---------------------------------------------------------
    @Patch(':id/cancelar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    cancelar(
    @Param('id') id: string, @Req() req: any,) {
        return this.ingresoService.cancelar(+id, req.user.id_consultorio);
    }

    // ---------------------------------------------------------
    // ABONAR INGRESO
    // ---------------------------------------------------------
    @Post(':id/abonar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    abonar(@Param('id') id: string, @Body() dto: AbonarIngresoDto, @Req() req: any) {
        return this.ingresoService.abonar(+id, dto, req.user.id_consultorio);
    }

    // =========================================================
    // --------------------- CORTE DE CAJA ---------------------
    // =========================================================

    // ---------------------------------------------------------
    // ABRIR CORTE
    // ---------------------------------------------------------
    @Post('corte/abrir')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    abrirCorte(@Body() dto: CreateCorteDto, @Req() req) {
        return this.ingresoService.abrirCorte(
        dto,
        req.user.id_consultorio,
        req.user.id_usuario
        );
    }

    // ---------------------------------------------------------
    // CERRAR CORTE (PREGUNTARLE A MI MAMA SI SERIA BUENA IDEA CALCULARLO O PARA CONTROL INGRESARLO )
    // ---------------------------------------------------------
    @Post('corte/cerrar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    cerrarCorte(@Req() req) {
        return this.ingresoService.cerrarCorte(
            req.user.id_consultorio,
            req.user.id_usuario
        );
    }



    // ---------------------------------------------------------
    // OBTENER CORTE ABIERTO
    // ---------------------------------------------------------
    @Get('corte/abierto')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    obtenerCorteAbierto(@Req() req) {
        return this.ingresoService.obtenerCorteAbierto(req.user.id_consultorio);
    }

    // ---------------------------------------------------------
    // OBTENER CORTE DEL DÍA
    // ---------------------------------------------------------
    @Get('corte/dia')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    obtenerCorteDelDia(@Req() req) {
        return this.ingresoService.obtenerCorteDelDia(req.user.id_consultorio);
    }
}
