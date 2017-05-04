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

const point_scheme = [12,10,8,7,6,5,4,3,2,1];
Vue.component('country', {
    template: '#country-template',
    props: {
        model: Country
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
Vue.component('leaderboard-country', {
    template: '#leaderboard-country-template',
    props: {
        model: Country
    }
});
class Tab {
    constructor(id,label) {
        this.id = id;
        this.label = label;
    }
}
Vue.component('tab',{
    template: '#tab',
    props: ['model','currenttab'],
    computed: {
        active() {
            return this.model==this.currenttab;
        }
    },
    methods: {
        setTab() {
            this.$emit('set-tab',this.model);
        }
    }
});

const running_order = Object.keys(country_data);

const country_map = {}
const all_countries = running_order.map(function(name,i){ 
    const c = new Country(country_data[name],i+1);
    country_map[name] = c;
    return c;
});

let countries_unjudged, countries_judged, name='';
const tabs = [new Tab('judging','Judge'), new Tab('leaderboard','Leaderboard')];
let data = {
    countries_judged: [],
    countries_unjudged: all_countries.slice(),
    name: '',
    leaderboard: {},
    tab: tabs[0],
    tabs: tabs

}
if('nulpoints' in localStorage) {
    let saved_data = JSON.parse(localStorage['nulpoints']);
    data.countries_judged = saved_data.judged.map(x=>all_countries.find(c=>c.country==x));
    data.countries_judged.forEach(function(c,i){ c.index = i; c.judged = true })
    data.countries_unjudged = all_countries.filter(c=>saved_data.judged.indexOf(c.country)==-1);
    data.name = saved_data.name;
}

const RATE_URL = 'http://somethingorotherwhatever.com/nulpoints/rate.php';
class Storage {
    constructor(app) {
        this.app = app;
    }
    save_local() {
        let data = {
            name: this.app.name,
            judged: this.app.countries_judged.map(c=>c.country)
        };
        localStorage['nulpoints'] = JSON.stringify(data);
    }
    set_name(name) {
        let d = new FormData();
        d.append('command','set_name');
        d.append('name',name);
        fetch(RATE_URL,{method:'post',mode:'cors',credentials:'include',body:d})
    }
    set_ratings() {
        const ratings = this.app.countries_judged.map(c=>c.country);
        const d = new FormData();
        d.append('command','set_ratings');
        d.append('ratings',JSON.stringify(ratings));
        fetch(RATE_URL,{method:'post',mode:'cors',credentials:'include',body:d})
    }
    get_leaderboard() {
        return fetch(`${RATE_URL}?command=leaderboard`,{method:'GET',mode:'cors',credentials:'include'}).then(r=>r.json());
    }
}


const app = new Vue({
    el: '#app',
    data: data,
    watch: {
        countries_judged: function() {
            this.countries_judged.forEach(function(c,i){
                c.index = i;
                c.judged = true;
            });
            this.countries_unjudged.forEach(function(c){
                c.judged = false;
            });
            this.storage.save_local();
            this.storage.set_ratings();
        },
        name: function() {
            this.storage.save_local();
            this.storage.set_name(this.name);
        }
    },
    computed: {

    },
    methods: {
        setTab(tab) {
            this.tab = tab;
        }
    },
    created: function() {
        const app = this;
        app.storage = new Storage(app);
    },
    mounted: function() {
        const app = this;

        function load_leaderboard() {
            app.storage.get_leaderboard().then(function(l) {
                app.leaderboard = l.map(function(d) {
                    const country = country_map[d.country];
                    country.score = d.score;
                    return country;
                });
            });
        }
        setInterval(load_leaderboard,5000);
        load_leaderboard();
    }
});
