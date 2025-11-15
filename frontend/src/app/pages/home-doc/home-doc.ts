import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-home-doc',
  imports: [RouterOutlet, Navbar],
  templateUrl: './home-doc.html',
  styleUrl: './home-doc.css'
})
export class HomeDoc {

}
