import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.usuario.findMany();
    }

    async create(data: CreateUsuarioDto) {
        // Generar hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.contrase_a, saltRounds);

        return this.prisma.usuario.create({
            data: {
            correo: data.correo,
            contrase_a: hashedPassword,
            rol: data.rol,
            proveedor_login: data.proveedor_login,
            status: data.status,
            id_consultorio: data.id_consultorio,
            },
        });
    }
}
/* USO FUTURO EN CONDICIONES
const isMatch = await bcrypt.compare(inputPassword, usuario.contrase_a);
if (!isMatch) throw new Error('Contraseña incorrecta');
 */
