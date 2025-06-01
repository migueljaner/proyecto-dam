export function NavItem({ href, text, icon, active = false }) {
    return (
        <li class={active ? 'side-nav--active' : ''}>
            <a
                href={href}
                class="flex items-center py-4 px-8 text-white text-[1.5rem] uppercase font-normal transition-all duration-300 hover:translate-x-1 side-nav-link"
            >
                <svg class="w-[1.9rem] h-[1.9rem] fill-current mr-8">
                    <use href={`/img/icons.svg#icon-${icon}`}></use>
                </svg>
                {text}
            </a>
        </li>
    );
}
