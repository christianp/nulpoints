class Country {
    constructor(data, running_order) {
        const c = this;
        this.running_order = running_order;
        this.index = 0;
        this.judged = false;
        Object.keys(data).forEach(function(k) {
            c[k] = data[k];
        });
        this.css = {};
        this.css[`flag-icon-${this.code.toLowerCase()}`] = true;
    }
}

const point_scheme = [12,11,10,9,8,7,6,5,4,3,2,1];
Vue.component('country', {
    template: '#country-template',
    props: {
        model: Country
    },
    data: function() {
        return {}
    },
    computed: {
        points: function() {
            const i = this.model.index;
            if(i<point_scheme.length) {
                return point_scheme[i];
            } else {
                return 0;
            }
        }
    }
});

const running_order = Object.keys(country_data);

const all_countries = running_order.map(function(name,i){ return new Country(country_data[name],i+1)});
let countries_unjudged, countries_judged;
if('nulpoints' in localStorage) {
    let saved_data = JSON.parse(localStorage['nulpoints']);
    countries_judged = saved_data.judged.map(x=>all_countries.find(c=>c.country==x));
    countries_unjudged = all_countries.filter(c=>saved_data.judged.indexOf(c.country)==-1);
} else {
    countries_judged = [];
    countries_unjudged = all_countries.slice();
}

const app = new Vue({
    el: '#app',
    data: {
        countries_judged: countries_judged,
        countries_unjudged: countries_unjudged
    },
    watch: {
        countries_judged: function() {
            this.countries_judged.forEach(function(c,i){
                c.index = i;
                c.judged = true;
            });
            this.countries_unjudged.forEach(function(c){
                c.judged = false;
            });
            if(this.storage) {
                this.storage.save();
            }
        }
    },
    computed: {
    }
});

class Storage {
    constructor(app) {
        this.app = app;
    }
    save() {
        let data = {
            judged: this.app.countries_judged.map(c=>c.country)
        };
        console.log(data);
        localStorage['nulpoints'] = JSON.stringify(data);
    }
}

app.storage = new Storage(app);
